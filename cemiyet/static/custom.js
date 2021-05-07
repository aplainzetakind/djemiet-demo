function get_hovers() {
    have = new Set();
    qlist = [];

    $('.popup').each(function() {
        have.add(parseInt($(this).attr('id').replace("pop-","")));
    });

    $('.reflink').each(function() {
        target = $(this).attr("reftarget");
        id = parseInt(target);
        if (!have.has(id)) {
            qlist.push("id=" + target);
            have.add(id);
        };
    });

    if (qlist.length) {
        query = qlist.join('&');

        fetch('/popups?' + query, { method : 'GET' })
            .then(response => {
                if (response.status == '200') {
                    return response.text();
                }
            }
            ).then(html => {
                $('#bench').append(html);
            }
            )
    }
}

function enable_hovers() {
    $(".reflink").hover(function() {
        refid = $(this).attr("reftarget");
        target = "#pop-" + refid;
        card = $(this).closest(".post");
        topoffset = $(this).offset().top - card.offset().top;
        leftoffset = $(this).offset().left - card.offset().left +
            $(this).width();
        $(target).appendTo(card);
        $(target).css({top: topoffset, left: leftoffset});
        $(target).show();
    }, function() {
        $(target).prependTo($("#bench"));
    });
}

function dotscis(id) {
    post = $('#post-' + id);
    if (post.closest('#focusdiv').length) {
        post.find('.dotscis').fadeOut('fast');
        post.nextAll().slideUp("fast", () => {
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
    card.prevAll().fadeOut("fast", () => {
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
    post.slideDown("fast", refresh_gallery);
}

async function fetch_posts(ids) {
    if (typeof(ids) === 'number') {
        query = 'id=' + ids
    } else {
    query = ids.map((n) => { return 'id=' + n }).join('&');
    }
    query = '/card?' + query
    let resp = await fetch(query, { method: 'GET' });
    let html = await resp.text();
    return html;
}

function home() {
    $('#focusdiv').fadeOut('fast');
    $('#gallerydiv').fadeOut('fast', () => {
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
    $('#cleartags').fadeOut('fast');
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
            $('#cleartags').fadeOut('fast');
        }
        refresh_gallery();
    });
    $(function() {
        while( $('#taglist').height() > $('#topbar').height() ) {
            $('#taglist').css('font-size', (parseInt($('#taglist').css('font-size')) - 1) + "px" );
        }
    });
    if ($('#cleartags').css('display') === 'none') {
        $('#cleartags').fadeIn('fast');
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

async function init_index(ids) {
    fetch_posts(ids).then((html) => {
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
        .css({'opacity': '0', 'visibility': 'visible'}).fadeTo('fast', 100);
    } else if ((!hasprev) && (!$('#leftnav').css('visibility') === 'hidden'))
    {
        $('#leftnav').fadeTo('fast', 0).css({'visibility': 'hidden'});
    }

    if ((hasnext) && ($('#rightnav').css('visibility') === 'hidden'))
    {
        $('#rightnav')
        .css({'opacity': '0', 'visibility': 'visible'}).fadeTo('fast', 100);
    } else if ((!hasnext) && (!$('#rightnav').css('visibility') === 'hidden'))
    {
        $('#rightnav').fadeTo('fast', 0).css({'visibility': 'hidden'});
    }

}

async function refresh_gallery(page) {
    $('.nav').fadeTo('fast', 0).css({'visibility': 'hidden'});

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

    query = ['/gallery', params.join('&')].join('?');

    $('#gallerydiv').fadeOut("fast", () => {
        fetch(query, { method: 'GET' })
            .then(response => {
                if (response.status == '200') {
                    return response.text();
                }
            })
            .then(newgallery => {
                $('#gallerydiv').html(newgallery);
                override_refs();
                $('#gallerydiv').fadeIn("fast", () => {
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
        $('#focusdiv .dotscis').last().fadeIn('fast');
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
        post.find('.dotscis').fadeIn('fast');
        post.find('.dotscis').fadeIn('fast');
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
        $('#formswitch').slideUp('fast', () => {
            $('#formdiv').slideDown('fast');
        });
    } else {
        $('#formdiv').slideUp('fast', () => {
            $('#formswitch').slideDown('fast');
        });
    }
}

async function focus_post(id, clear, prepend) {
    $('.nav').fadeTo('fast', 0).css({'visibility': 'hidden'});
    $('#gallerydiv').fadeOut('fast', () => {
        post_to_focus(id, clear, prepend)
        post = $('#post-' + id);
    });
}
