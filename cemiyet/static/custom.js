function get_hovers() {
    var have, missing, qlist, query;
    have = new Set();
    qlist = [];

    $('.popup').each(function() {
        have.add(parseInt($(this).attr('id').replace("pop-","")));
    });

    $('.reflink:visible').each(function() {
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
    var refid, postid, target, card, topoffset, leftoffset;
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
        $(target).prependTo($(window).find(".bg-div"));
        $(target).hide()
    });
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

function override_refs() {
    $('.content-card .reflink').on("click", function(e) {
        e.preventDefault();
        id = parseInt($(this).attr('reftarget'));
        focus_post(id, true);
    });
}

function chain_post(post, id) {
    post.slideDown("slow", () => {
        fetch('/gallery?parent=' + id, { method: 'GET' })
            .then(response => {
                if (response.status == '200') {
                    return response.text();
                }
            }
            ).then(newgallery => {
                $('#gallerydiv').html(newgallery);
                $('#gallerydiv').fadeIn("slow");
                override_refs();
            }
            ).then(
                get_hovers
            ).then( () => {
                enable_hovers();
            });
    });
}

async function focus_post(id, clear) {
    post = $('#card-' + id);

    $('#gallerydiv').hide();
    post.hide();
    if (clear) {
        $('#focusdiv').empty();
    }

    if (post.length) {
        post.attr("class", "ten columns offset-by-one content-card small-square");
        post.appendTo($('#focusdiv'));
    } else {
        let resp = await fetch('/card/' + id, { method: 'GET' });
        let html = await resp.text();
        let current = $('#focusdiv').html();
        $('#focusdiv').html(current + html);
        post = $('#card-' + id);
    }

    chain_post(post, id);
}
