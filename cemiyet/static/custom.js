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
                $('.bg-div').prepend(html);
            }
            )
    }
}

function enable_hovers() {
    $(".reflink").hover(function() {
        refid = $(this).attr("reftarget");
        target = "#pop-" + refid;
        card = $(this).closest(".content-card");
        topoffset = $(this).offset().top - card.offset().top;
        leftoffset = $(this).offset().left - card.offset().left +
            $(this).width();
        $(target).appendTo(card);
        $(target).css({top: topoffset, left: leftoffset});
        $(target).show();
    }, function() {
        $(target).hide();
        $(target).prependTo($(".bg-div"));
    });
}

function dotscis(id) {
    post = $('#card-' + id);
    if (post.closest('#focusdiv').length) {
        post.children('.dotscis').fadeOut('fast');
        post.nextAll().slideUp("fast", () => {
            post.nextAll().remove();
            refresh_gallery();
        });
    }
    if (post.closest('#gallerydiv').length) {
        focus_post(id);
    }
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
                current = $(this).text();
                $(this).text(current === '☆' ? '★' : '☆');
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
        card = $(this).closest('.content-card');
        refclick(card, id);
    });

    $('.idcode').unbind('click');
    $('.idcode').click(function(e) {
        e.stopPropagation();
        e.preventDefault();
        id = $(this).attr('postid');
        tag = $(this).attr('posttag');
        current_body = $('#id_body').val();
        current_tag = $('#tag_text').val();
        $('#id_body').val(current_body + '[[' + id + ']]\n');
        if (!current_tag) {
            $('#tag_text').val(tag);
        }
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

async function init_index(ids) {
    fetch_posts(ids).then((html) => {
        $('#focusdiv').html(html);
        $('#focusdiv .dotscis').text('✂');
        $('#focusdiv .dotscis').last().hide();
        $('#focusdiv > div').fadeIn();
        /* $(window).bind("scroll resize", placenavs); */
        refresh_gallery();
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
    if (page) {
        pageq = '?page=' + page
    } else {
        pageq = ''
    }

    focused = $('#focusdiv').children();

    if (focused.length) {
        id = focused.last().attr('id').replace('card-','');
        query = '/gallery?parent=' + id + pageq
    } else {
        query = '/gallery' + pageq
    }

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

async function post_to_focus(id, clear, prepend) {
    post = $('#card-' + id);

    post.hide();
    if (clear) {
        $('#focusdiv').empty();
    }

    if (!prepend) {
        $('#focusdiv .dotscis').last().fadeIn('fast');
    }

    if (post.length) {
        post.attr("class", "ten columns offset-by-one content-card small-square");
    } else {
        html = await fetch_posts(id);
        post = $(html);
    }

    post.children('.dotscis').text('✂');
    post.children('.dotscis').hide();

    if (prepend) {
        post.children('.dotscis').fadeIn('fast');
        post.children('.dotscis').fadeIn('fast');
        post.prependTo($('#focusdiv'))
    } else {
        post.appendTo($('#focusdiv'))
    }

    override_refs();
    slide_new_post($('#card-' + id));
}

function clear_form() {
    $('#formdiv').find("input[type=text], textarea").val('');
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
        post = $('#card-' + id);
    });
}
