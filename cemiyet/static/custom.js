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

    if (qlist) {
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

function favourite(id) {
    options = {
        method: 'POST',
        body: id,
        headers: { 'X-CSRFToken': '{{ csrf_token }}' }
    };
    fetch('/watch', options)
        .then(response => {
            if (response.status == '200') {
                star = document.querySelector('#star-' + id);
                current = star.innerHTML;
                star.innerHTML = current === '☆' ? '★' : '☆';
            }
        }
        )
}

function focus_post(id) {
    post = document.getElementById('card-' + id);
    post.className = "ten columns offset-by-one content-card small-square";
    document.getElementById('focusdiv').append(post);
    fetch('/gallery?parents=' + id, { method: 'GET' })
        .then(response => {
            if (response.status == '200') {
                return response.text();
            }
        }
        ).then(html => {
            document.querySelector('#gallerydiv').innerHTML = html;
        }
        ).then(get_hovers).then(enable_hovers)
}
