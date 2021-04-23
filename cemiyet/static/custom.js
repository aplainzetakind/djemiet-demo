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
}

function slide_new_post(post, id) {
    post.children('.dotscis').text('✂');
    post.children('.dotscis').hide();
    post.slideDown("slow", refresh_gallery);
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

async function init_index(ids) {
    fetch_posts(ids).then((html) => {
        $('#focusdiv').html(html);
        $('#focusdiv .dotscis').text('✂');
        $('#focusdiv .dotscis').last().hide();
        $('#focusdiv > div').fadeIn();
        refresh_gallery();
    });
}

async function refresh_gallery() {
    focused = $('#focusdiv').children();
    if (focused.length) {
        id = focused.last().attr('id').replace('card-','');
        query = '/gallery?parent=' + id
    } else {
        query = '/gallery'
    }
    $('#gallerydiv').fadeOut("slow", () => {
        fetch(query, { method: 'GET' })
            .then(response => {
                if (response.status == '200') {
                    return response.text();
                }
            })
            .then(newgallery => {
                $('#gallerydiv').html(newgallery);
                override_refs(); //This needs to be specific to the container.
                $('#gallerydiv').fadeIn("slow", () => {
                    get_hovers();
                    enable_hovers();
                });
            });
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



async function focus_post(id, clear, prepend) {
    $('#gallerydiv').fadeOut('fast', () => {
        post_to_focus(id, clear, prepend)
        post = $('#card-' + id);
    });
}
