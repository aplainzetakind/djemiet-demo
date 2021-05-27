const animation_speed = 300;

// We keep the state of the page in an object, with methods to conveniently
// return url parameters for AJAX requests or setting the url. Intended to have
// a single instance.
class UrlState {
    constructor(obj) {
        this.ids = obj.id ? obj.id.map(Number) : [];
        this.tags = [];
        this.watch = obj.watch ? obj.watch[0] == ['true'] : false;
        if (obj.page && Number(obj.page[0])) {
            this.page = Number(obj.page[0]);
        }
    }

    get id_params() { return this.ids.map((n) => 'id=' + n).join('&'); }
    get tag_params() {
        return this.tags.map((t) => 'tag=' + t).join('&');
    }
    get watch_param() { return this.watch ? 'watch=' + this.watch : ''; }
    get page_param() { return this.page ? 'page=' + this.page : ''; }



    // Return the URL to be used in gallery refreshes. If there are posts in
    // focus, the last one is used for the `parent` parameter, the rest of the
    // focused posts are ignored.
    get gallery_url() {
        let parent = this.ids.length ? 'parent=' + this.ids[this.ids.length - 1] : ''

        return ['/posts?as=gallery',
            parent,
            this.tag_params,
            this.watch_param,
            this.page_param]
            .filter((s) => s.length)
            .join('&');
    }

    // Return the page URL, for setting with the history API.
    get content_url() {
        let q = [this.id_params,
            this.tag_params,
            this.watch_param,
            this.page_param].filter(s => s.length).join('&');
        return ['content', q].filter((s) => s.length).join('?');
    }

    // The page state as an object, for the history API.
    get state_obj() {
        return new Object({
            ids: this.ids,
            tags: this.tags,
            watch: this.watch,
            page: this.page
        });
    }

    // Invoke history.pushState with the appropriate parameters.
    set_url() {
        console.log('click');
        return history.pushState(this.state_obj, null, this.content_url);
    }
}

// The global variable to track the page state.
var urlstate;

// The initialization function. The argument is passed as JSON from the
// template.
async function init_index(obj) {
    urlstate = new UrlState(obj);
    if (obj.tag) { obj.tag.map(add_tag); }
    $('#favtoggle').toggleClass('favon', urlstate.watch);
    populate_focus();
    history.replaceState(urlstate.state_obj, null, urlstate.content_url);
    window.addEventListener('popstate', function(e) {
        urlstate.ids = e.state.ids;
        clear_tags();
        if (e.state.tags) { e.state.tags.map(add_tag); }
        urlstate.watch = e.state.watch;
        $('#favtoggle').toggleClass('favon', urlstate.watch);
        urlstate.page = e.state.page;
        $('#gallerydiv').fadeOut(animation_speed,() => {
            populate_focus();
        });
    });
}

// Refactored out of init_index and its addEventListener subroutine. Probably
// better to refactor further.
function populate_focus() {
    $('#focusdiv').fadeOut(animation_speed,() => {
        fetch_posts(urlstate.ids).then((html) => {
            $('#focusdiv').html(html);
            $('#focusdiv .plusscis').last().hide();
            $('#focusdiv .post').each(function() {
                render_image($(this));
            });
            $('#focusdiv').fadeIn();
            refresh_gallery();
        });
    });
}

// Makes an AJAX call to refresh the contents of the gallery div based on
// `urlstate`.
async function refresh_gallery() {
    $('.nav').fadeTo(animation_speed, 0).css({'visibility': 'hidden'});

    $.ajax({url: urlstate.gallery_url, success: (result) => {
        $('#gallerydiv').fadeOut(animation_speed, () => {
            $('#gallerydiv').html(result);
            get_hovers();
            enable_hovers();
            refresh_tokens();
            $('#gallerydiv').fadeIn(animation_speed, togglenavs);
        });
    }});
}

// Clicking the corner widget element, which appears as a plus sign in posts in
// the #gallerydiv, and as scissors in posts in the #focusdiv, performs
// different functions depending on that context.
function corner_widget(elem) {
    post = elem.closest('.post')
    postid = Number(post.attr('postid'));
    // If the post is in focus, remove the posts coming after it.
    if (post.closest('#focusdiv').length) {
        elem.fadeOut(animation_speed);
        post.nextAll().slideUp(animation_speed, () => {
            post.nextAll().remove();
            urlstate.ids = urlstate.ids.slice(0,urlstate.ids.indexOf(postid) + 1);
            urlstate.set_url();
            refresh_gallery();
        });
    }
    // If the post is in the gallery, append it to the focus.
    if (post.closest('#gallerydiv').length) {
        $('#gallerydiv').fadeOut(animation_speed, () => {
            post.find('.plusscis').hide();
            post.hide();
            append_post(post);
            urlstate.ids.push(postid);
            delete urlstate.page;
            urlstate.set_url();
            refresh_gallery();
        });
    }
}

// When posts move to focus, the placeholder image icon is replaced by the
// actual image by changing the `src` attribute. This function takes care of
// hiding the element until the actual image is loaded to prevent the momentary
// flashing of an oversized icon.
function render_image(post) {
    img = post.find('img');
    img.hide();
    img.on('load',function() {
        $(this).fadeIn(animation_speed);
    });
    img.attr('src', img.attr('source'));
}

// Appends a post to the #focusdiv. Only called once from corner_widget, so
// refactored only for the sake of organization.
function append_post(post) {
    render_image(post);
    $('#focusdiv').children().last().find('.plusscis').fadeIn(animation_speed);
    let param;
    if ($('#focusdiv').children().length) {
        param = {scrollTop: ($("#focusdiv").children().last().offset().top - 90)}
    } else {
        param = {scrollTop: 0}
    }
    $('html, body').animate(param, animation_speed);
    post.appendTo('#focusdiv');
    post.slideDown(animation_speed);
}

// What clicking a citation link effects is also context-dependent. Citations
// from #gallerydiv clear #focusdiv and move the cited posts into the #focusdiv
// as a singleton. Citations in #focusdiv clear the preceding posts and prepend
// the cited post to #focusdiv.
async function clickref(ref) {
    let target = Number(ref.attr('reftarget'));
    if ($('#post-' + target).length) {
        post = $('#post-' + target);
    } else {
        let html = await fetch_posts([target]);
        post = $(html);
    }
    post.hide();
    if (ref.closest('#gallerydiv').length) {
        $('#gallerydiv').fadeOut(animation_speed, () => {
            $('#focusdiv').slideUp(animation_speed, () => {
                $('#focusdiv').empty();
                $('#focusdiv').show();
                post.find('.plusscis').hide();
                append_post(post);
                urlstate.ids = [target];
                delete urlstate.page;
                urlstate.set_url();
                refresh_gallery();
            });
        });
    }
    if (ref.closest('#focusdiv').length) {
        thispostid = ref.closest('.post').attr('postid');
        $('html, body').animate({scrollTop: 0}, animation_speed).promise()
            .then(function() {
                while ($('#focusdiv').children().first().attr('postid') !== thispostid) {
                    urlstate.ids.shift();
                    $('#focusdiv').children().first().remove();
                }
                post.prependTo('#focusdiv');
                render_image(post);
                post.slideDown(animation_speed);
                get_hovers();
                enable_hovers();
                urlstate.ids.unshift(target);
                urlstate.set_url();
            });
    }
}

// Add a tag to the tagfilter. This function takes care both of updating
// `urlstate` and populating the UI elements, but does not make changes to the
// history. This is because when a page whose URL contains multiple tags, we
// loop over them using this function, and we do not want to creat multiple
// history nodes for this.
function add_tag(value) {
    value = value.toLowerCase();
    if (!urlstate.tags.includes(value)) {
        $('<div class="tag" tagname="' + value +'">' + value + '</div>').appendTo('#taglist')
        urlstate.tags.push(value);
        $('#taglist .tag').last().click(function(e) {
            e.stopPropagation();
            e.preventDefault();
            let tagname = $(this).attr('tagname')
            $(this).remove();
            urlstate.tags = urlstate.tags.filter(name => name !== tagname)
            if (!$('#taglist').children().length) {
                $('#cleartags').fadeOut(animation_speed);
            }
            refresh_gallery();
            urlstate.set_url();
        });
        $(function() {
            while( $('#taglist').height() > $('#topbar').height() ) {
                $('#taglist').css('font-size', (parseInt($('#taglist').css('font-size')) - 1) + "px" );
            }
        });
        if ($('#cleartags').css('display') === 'none') {
            $('#cleartags').fadeIn(animation_speed);
        }
    }
}

// This bundles a URL refresh with adding a tag. Used for adding tags from the
// autocomplete box or clicking the tag of a post.
function add_tag_with_history(value) {
    add_tag(value);
    refresh_gallery();
    urlstate.set_url();
}

// This is called from autocomplete element clicks. Also clears the autocomplete
// box.
function add_tag_from_autocomplete(e, ui) {
    e.preventDefault();
    $('#tagfilter').val('');
    value = ui.item.value;
    add_tag_with_history(value);
}

// Called when the logo is clicked. Clears `urlstate` and refreshes the page
// accordingly.
function home() {
    $('#focusdiv').fadeOut(animation_speed);
    $('#gallerydiv').fadeOut(animation_speed, () => {
        $('#focusdiv').empty();
        urlstate.ids = [];
        urlstate.tags = [];
        clear_tags();
        urlstate.watch = false;
        delete urlstate.page;
        urlstate.set_url();
        $('#focusdiv').fadeIn();
        refresh_gallery();
    });
}

// Toggles the watchlist filter.
function toggle_favfilter() {
    $('#favtoggle').toggleClass('favon')
    urlstate.watch = (!urlstate.watch)
    urlstate.set_url();
    refresh_gallery();
}

// Determine the missing hover divs for citations on the page to fetch them and
// insert into the #bench div.
function get_hovers() {
    let have = new Set();
    let need = new Set();

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
        let query = Array.from(need)
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
        topoffset = $(this).offset().top - card.offset().top;
        offset = $(this).offset().left - card.offset().left
        target.appendTo(card);
        if ($(this).offset().left < $(window).width() / 2) {
            leftoffset = offset + $(this).width();
            target.css({top: topoffset, left: leftoffset});
        } else {
            rightoffset = card.width() - offset
            target.css({top: topoffset, right: rightoffset});
        }
        target.show();
    }, function() {
        target.prependTo($("#bench"));
        target.hide();
    });
}

// Called when the star icon is clicked to toggle whether the post is
// watchlisted.
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

// When the number of a post is clicked, the markdown for citing it is
// automatically inserted into the posting form and the page scrolls to the
// form.
function clickid(elem) {
    id = elem.closest('.post').attr('postid');
    tag = elem.closest('.post').attr('posttag');
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
        scrollTop: ($("#formdiv").offset().top - 90)
    }, animation_speed);
}

// Fetches the html for the posts with given ids. The argument is always an
// Array.
async function fetch_posts(ids) {
    if (ids.length) {
        query = '/posts?' + ids.map((n) => { return 'id=' + n }).join('&');
        let resp = await fetch(query, { method: 'GET' });
        return resp.text();
    } else {
        return '';
    }
}

// Clear the taglist and set urlstate.tags, but don't refresh the callery or set
// the URL yet.
function clear_tags() {
    $('#taglist').empty();
    $('#cleartags').fadeOut(animation_speed);
    urlstate.tags = [];
}

// Fired by clicking the clear tags icon from the top bar.
function clear_tags_click() {
    clear_tags();
    refresh_gallery();
    urlstate.set_url();
}

// Here `target` is one of '1', 'prev', 'next', 'last'. The page numbers these
// correspond to is read off the attributes of #navigation, which is served by
// gallery refreshes.
function nav(target) {
    urlstate.page = $('#navigation').attr(target);
    urlstate.set_url();
    refresh_gallery();
}

// Toggle the visibility of navigation arrows depending on whether appropriate
// pages exist.
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


// Trims the directory part of the selected file in the upload dialog.
function update_filename() {
  file = $('#id_image').val()
  fileName = file.split("\\");
  $('#filename').text(fileName[fileName.length - 1]);
}

// Clear form.
function clear_form() {
    $('#formdiv').find("input[type=text], input[type=file], textarea").val('');
    $('#filename').text('No image selected.');
    $('#formerrordiv').empty();
}

// Toggle the visibility of the posting form.
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


// Override default form submission with this function in order to perform an
// AJAX without a page refresh. TODO: Fix quick multiple clicks resulting in
// multiple posts.
function submit_form() {
    fd = new FormData($('form')[0]);

    $.ajax({
        url: 'content',
        data: fd,
        processData: false,
        contentType: false,
        type: 'POST',

        success: function(data) {
            clear_form();
            toggle_form();
            refresh_gallery();
            to_update = JSON.parse(data)
            // Update counters of affected posts. This has potential to be very
            // expensive.
            for (k of Object.keys(to_update)) {
                $("[postid='" + k +"']").each(function() {
                    console.log(to_update[k]);
                    $(this).find('.counter')
                    .html(to_update[k][0] + '/' + to_update[k][1]);
                });
            }
        },

        error : function(xhr,errmsg,err) {
            $('#formerrordiv').empty();
            if (xhr.status === 400) {
                errobject = JSON.parse(xhr.responseJSON);
                for (k of Object.keys(errobject)) {
                    for (v of errobject[k]) {
                        $('<p>' + v['message'] + '</p>')
                            .appendTo('#formerrordiv');
                    }
                }
            }
        }
    });
}

// When an image in #focusdiv is clicked, display it in a lightbox.
function image_click(img) {
    if (img.closest('#focusdiv').length) {
        let target = img.attr('src');
        $('#lightboximg').on('load',function() {
            $('#lightbox').show();
        });
        $('#lightboximg').attr('src',target);
    }
}

function close_lightbox() {
    $('#lightbox').hide();
    $('#lightboximg').attr('src','');
}

// Get user's invitation links, if there are any, then show #tokenbox and
// populate and position #tokenpopup.
function refresh_tokens() {
    $.ajax({
        url: 'tokens',
        type: 'GET',

        success: function(data) {
            let tokens = JSON.parse(data);
            if (tokens.length) {
                $('#tokenbox').fadeIn(animation_speed);
                $('#tokenpopup').click(function(e) { e.stopPropagation(); });
                $('#tokenbox').click(function(e) {
                    e.preventDefault();
                    let innerhtml ='';
                    for (let token of tokens) {
                        innerhtml += '<p>' + token + '</p>';
                    }
                    $('#tokenlist').html(innerhtml);
                    rightoffset = $(window).width() - $('#tokenbox').offset().left + $('#tokenbox').width();
                    $('#tokenpopup').css({top: 20, right: rightoffset});
                    $('#tokenpopup').fadeIn(animation_speed);
                });
            } else {
                $('#tokenbox').fadeOut(animation_speed);
            }
        }
    });
}
