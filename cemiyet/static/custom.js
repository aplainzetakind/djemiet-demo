const animation_speed = 300



// Determine the missing hover divs for citations on the page to fetch them and
// insert into the #bench div.
function get_hovers() {
    have = new Set();
    need = new Set();

    // Take stock of the hover divs we already have.
    $('.hoverpost').each(function() {
        have.add(parseInt($(this).attr('id').replace("pop-","")));
    });

    // Determine which hover divs are needed.
    $('#gallerydiv .reflink').each(function() {
        need.add(parseInt($(this).attr('reftarget')));
    });
    $('#focusdiv .reflink').each(function() {
        need.add(parseInt($(this).attr('reftarget')));
    });

    // Remove the intersection from each.
    for (let x of need) {
        if (have.has(x)) {
            need.delete(x);
            have.delete(x);
        }
    }

    // Get the needed posts and append to #bench
    if (need.size) {
        query = Array.from(need)
            .map(x => "id=" + x);
        query.unshift('/posts?as=hover');
        query = query.join('&');
        $.get(query, function(html, status) {
            if (status == 'success') {
                $('#bench').append(html);
            }
        });
    }

    // Remove those no longer needed.
    for (let id of have) {
        $('#pop-' + id).remove();
    }
}



// Enable post display when citation links are hovered.
function enable_hovers() {
    $(".reflink").unbind('hover');
    $(".reflink").hover(function() {
        refid = $(this).attr("reftarget");
        target = $("#pop-" + refid);
        card = $(this).closest(".post");
        maxwidth = $(window).width / 4
        topoffset = $(this).offset().top - card.offset().top;
        offset = $(this).offset().left - card.offset().left
        target.appendTo(card);
        if ($(this).offset().left < $(window).width() / 2) {
            leftoffset = offset + $(this).width();
            target.css({top: topoffset, left: leftoffse, maxWidth: maxwidtht});
        } else {
            rightoffset = card.width() - offset
            target.css({top: topoffset, right: rightoffset, maxWidth: maxwidth});
        }
        target.show();
    }, function() {
        target.prependTo($("#bench"));
        target.hide();
    });
}

function dotscis(id) {
    post = $('#post-' + id);
    if (post.closest('#focusdiv').length) {
        post.find('.dotscis').fadeOut(animation_speed);
        post.nextAll().slideUp(animation_speed, () => {
            post.nextAll().remove();
            refresh_gallery();
        });
    }
    if (post.closest('#gallerydiv').length) {
        focus_post(id);
    }
}

function toggle_favfilter() {
    current = $('#favtoggle').text();
    $('#favtoggle').text(current === '☆' ? '★' : '☆');
    refresh_gallery();
}

function favourite(id, token) {
    options = {
        method: 'POST',
        body: id,
        headers: { 'X-CSRFToken': token }
    };
    fetch('/watch', options)
        .then(response => {
            if (response.status == '200') {
                $('.star-' + id).each( function() {
                    $(this).toggleClass("watched");
                });
            }
        });
}

async function remove_prevs(card) {
    card.prevAll().fadeOut(animation_speed, () => {
        card.prevAll().remove();
        return true
    });
}

async function refclick(card, id) {
    flag = card.closest('#gallerydiv').length
    if (!flag) {
        let dummy = await remove_prevs(card);
    }
    focus_post(id, (flag), (!flag));
}

function override_refs() {
    $('.reflink').unbind('click');
    $('.reflink').click(function(e) {
        e.stopPropagation();
        e.preventDefault();
        id = parseInt($(this).attr('reftarget'));
        card = $(this).closest('.post');
        refclick(card, id);
    });

    $('.idcode').unbind('click');
    $('.idcode').click(function(e) {
        e.stopPropagation();
        e.preventDefault();
        id = $(this).attr('postid');
        tag = $(this).attr('posttag');
        if ($('#formdiv').css('display') === 'none') {
            toggle_form();
        }
        current_body = $('#id_body').val();
        current_tag = $('#tag_text').val();
        $('#id_body').val(current_body + '[[' + id + ']]\n');
        if (!current_tag) {
            $('#tag_text').val(tag);
        }
        $('html, body').animate({
            scrollTop: ($("#formdiv").offset().top - 40)
        }, 200);
    });
}

function slide_new_post(post, id) {
    post.children('.dotscis').text('✂');
    post.children('.dotscis').hide();
    post.slideDown(animation_speed, refresh_gallery);
}

async function fetch_posts(ids) {
    console.log(ids)
    if (!ids == []) {
        if (typeof(ids) === 'number') {
            query = 'id=' + ids
        } else {
            query = ids.map((n) => { return 'id=' + n }).join('&');
        }
        query = '/posts?' + query
        let resp = await fetch(query, { method: 'GET' });
        let html = await resp.text();
        return html;
    } else {
        return '';
    }
}

function home() {
    $('#focusdiv').fadeOut(animation_speed);
    $('#gallerydiv').fadeOut(animation_speed, () => {
    $('#focusdiv').empty();
    refresh_gallery();
    $('#focusdiv').fadeIn();
    });
}

function get_tags() {
    result = []
    $('.tag').each(function() {
        result.push($(this).attr('tagname'));
    });
    return result;
}

function clear_tags() {
    $('#taglist').empty();
    $('#cleartags').fadeOut(animation_speed);
    refresh_gallery();
}

function add_tag_div(value) {
    current = get_tags();
    if (!current.includes(value)) {
    $('<div class="tag" tagname="' + value +'">' + value + '</div>').appendTo('#taglist')
    $('#taglist .tag').last().click(function(e) {
        e.stopPropagation();
        e.preventDefault();
        $(this).remove();
        if (!$('#taglist').children().length) {
            $('#cleartags').fadeOut(animation_speed);
        }
        refresh_gallery();
    });
    $(function() {
        while( $('#taglist').height() > $('#topbar').height() ) {
            $('#taglist').css('font-size', (parseInt($('#taglist').css('font-size')) - 1) + "px" );
        }
    });
    if ($('#cleartags').css('display') === 'none') {
        $('#cleartags').fadeIn(animation_speed);
    }
    refresh_gallery();
    }
}

function add_tag_from_autocomplete(e, ui) {
    e.preventDefault();
    $('#tagfilter').val('');
    value = ui.item.value;
    add_tag_div(value);
}

async function init_index(obj) {
    fetch_posts(obj.id).then((html) => {
        $('#focusdiv').html(html);
        $('#focusdiv .dotscis').text('✂');
        $('#focusdiv .dotscis').last().hide();
        $('#focusdiv > div').fadeIn();
        /* $(window).bind("scroll resize", placenavs); */
        refresh_gallery();
        if ($('.form-error').length) {
            toggle_form();
        }
    });
}

function nav(target) {
    page = $('#navigation').attr(target);
    refresh_gallery(page);
}

function togglenavs() {
    hasprev = $('#navigation').attr('prev');
    hasnext = $('#navigation').attr('next');

    if ((hasprev) && ($('#leftnav').css('visibility') === 'hidden'))
    {
        $('#leftnav')
        .css({'opacity': '0', 'visibility': 'visible'}).fadeTo(animation_speed, 100);
    } else if ((!hasprev) && (!$('#leftnav').css('visibility') === 'hidden'))
    {
        $('#leftnav').fadeTo(animation_speed, 0).css({'visibility': 'hidden'});
    }

    if ((hasnext) && ($('#rightnav').css('visibility') === 'hidden'))
    {
        $('#rightnav')
        .css({'opacity': '0', 'visibility': 'visible'}).fadeTo(animation_speed, 100);
    } else if ((!hasnext) && (!$('#rightnav').css('visibility') === 'hidden'))
    {
        $('#rightnav').fadeTo(animation_speed, 0).css({'visibility': 'hidden'});
    }

}

async function refresh_gallery(page) {
    $('.nav').fadeTo(animation_speed, 0).css({'visibility': 'hidden'});

    params = []

    focused = $('#focusdiv').children();
    if (focused.length) {
        id = focused.last().attr('id').replace('post-','');
        params.push('parent=' + id);
    }

    if ($('#favtoggle').text() === '★') {
        params.push('watch=true');
    }

    params = params.concat(get_tags().map(function(tag) { return 'tag=' + tag }));

    if (page) {
        params.push('page=' + page);
    }

    params.unshift('/posts?as=gallery');
    query = params.join('&');

    $('#gallerydiv').fadeOut(animation_speed, () => {
        fetch(query, { method: 'GET' })
            .then(response => {
                if (response.status == '200') {
                    return response.text();
                }
            })
            .then(newgallery => {
                $('#gallerydiv').html(newgallery);
                override_refs();
                $('#gallerydiv').fadeIn(animation_speed, () => {
                    get_hovers();
                    enable_hovers();
                });
            })
            .then(togglenavs);
    })
}

function update_filename() {
  file = $('#id_image').val()
  fileName = file.split("\\");
  $('#filename').text(fileName[fileName.length - 1]);
}

async function post_to_focus(id, clear, prepend) {
    post = $('#post-' + id);

    post.hide();
    if (clear) {
        $('#focusdiv').empty();
    }

    if (!prepend) {
        $('#focusdiv .dotscis').last().fadeIn(animation_speed);
    }

    if (!post.length) {
        html = await fetch_posts(id);
        post = $(html);
        post.css('display', 'none');
    }

    post.find('.dotscis').text('✂');
    post.find('.dotscis').hide();
    imgurl = post.find('img').attr('source');
    post.find('img').attr('src', '');
    post.find('img').attr('src', imgurl);

    if (prepend) {
        post.find('.dotscis').fadeIn(animation_speed);
        post.find('.dotscis').fadeIn(animation_speed);
        post.prependTo($('#focusdiv'))
    } else {
        post.appendTo($('#focusdiv'))
    }

    override_refs();
    slide_new_post($('#post-' + id));
}

function clear_form() {
    $('#formdiv').find("input[type=text], input[type=file], textarea").val('');
    $('#filename').text('No image selected.');
    $('.form-error').hide();
}

function toggle_form() {
    if ($('#formdiv').css('display') === 'none') {
        lastfocus = $('#focusdiv').children().last()
        if ((!$('#id_body').val()) &&
            (!$('#tag_text').val()) && (lastfocus.length)) {
            $('#id_body').val('[[' + lastfocus.attr('postid') + ']]\n')
            $('#tag_text').val(lastfocus.attr('posttag') )
        }
        $('#formswitch').slideUp(animation_speed, () => {
            $('#formdiv').slideDown(animation_speed);
        });
    } else {
        $('#formdiv').slideUp(animation_speed, () => {
            $('#formswitch').slideDown(animation_speed);
        });
    }
}

async function focus_post(id, clear, prepend) {
    $('.nav').fadeTo(animation_speed, 0).css({'visibility': 'hidden'});
    $('#gallerydiv').fadeOut(animation_speed, () => {
        post_to_focus(id, clear, prepend)
        post = $('#post-' + id);
    });
}
