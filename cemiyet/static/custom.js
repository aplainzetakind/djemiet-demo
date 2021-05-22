const animation_speed = 300

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

    get content_url() {
        let q = [this.id_params,
            this.tag_params,
            this.watch_param,
            this.page_param].filter(s => s.length).join('&');
        return ['content', q].filter((s) => s.length).join('?');
    }

    get state_obj() {
        return new Object({
            ids: this.ids,
            tags: this.tags,
            watch: this.watch,
            page: this.page
        });
    }

    set_url() {
        return history.pushState(this.state_obj, null, this.content_url);
    }

}

// A global variable to track the url parameters for the page.
var urlstate;

// The initialization function. The argument is passed as JSON from the
// template.
async function init_index(obj) {
    urlstate = new UrlState(obj);
    if (obj.tag) { obj.tag.map(add_tag); }
    if (urlstate.watch) { $('#favtoggle').addClass('favon'); }
    $('#focusdiv').hide();
    fetch_posts(urlstate.ids).then((html) => {
        $('#focusdiv').html(html);
        $('#focusdiv .plusscis').last().hide();
        $('#focusdiv .post').each(function() {
            render_image($(this));
        });
        $('#focusdiv').fadeIn();
        refresh_gallery();
    });
    history.replaceState(urlstate.state_obj, null, urlstate.content_url);
    window.addEventListener('popstate', function(e) {
        urlstate.ids = e.state.ids;
        clear_tags();
        if (e.state.tags) { e.state.tags.map(add_tag); }
        urlstate.watch = e.state.watch;
        $('#favtoggle').toggleClass('favon', urlstate.watch);
        urlstate.page = e.state.page;
        $('#focusdiv').fadeOut(animation_speed,() => {
            fetch_posts(urlstate.ids).then((html) => {
                $('#gallerydiv').fadeOut(animation_speed,() => {
                    $('#focusdiv').html(html);
                    $('#focusdiv .plusscis').last().hide();
                    $('#focusdiv .post').each(function() {
                        render_image($(this));
                    });
                    $('#focusdiv').fadeIn();
                    refresh_gallery();
                });
            });
        });
    });
}

async function refresh_gallery() {
    $('.nav').fadeTo(animation_speed, 0).css({'visibility': 'hidden'});

    $.ajax({url: urlstate.gallery_url, success: (result) => {
        $('#gallerydiv').fadeOut(animation_speed, () => {
            $('#gallerydiv').html(result);
            get_hovers();
            enable_hovers();
            $('#gallerydiv').fadeIn(animation_speed, togglenavs);
        });
    }});
}

// The main functions which make such changes to the DOM as to be reflected in
// the url:
//
// corner_widget
// add_tag
// home
// refclick
// toggle_favfilter

function corner_widget(elem) {
    post = elem.closest('.post')
    postid = Number(post.attr('postid'));
    if (post.closest('#focusdiv').length) {
        elem.fadeOut(animation_speed);
        post.nextAll().slideUp(animation_speed, () => {
            post.nextAll().remove();
            urlstate.ids = urlstate.ids.slice(0,urlstate.ids.indexOf(postid) + 1);
            urlstate.set_url();
            refresh_gallery();
        });
    }
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

function render_image(post) {
    img = post.find('img');
    img.hide();
    img.on('load',function() {
        $(this).fadeIn(animation_speed);
    });
    img.attr('src', img.attr('source'));
}

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
        $('html, body').animate({scrollTop: 0}, animation_speed, () => {
            while ($('#focusdiv').children().first().attr('postid') !== thispostid) {
                urlstate.ids.shift();
                $('#focusdiv').children().first().slideUp(animation_speed);
                $('#focusdiv').children().first().remove();
            }
            post.prependTo('#focusdiv');
            render_image(post);
            post.slideDown(animation_speed);
            get_hovers();
            enable_hovers();
        });
        urlstate.ids.unshift(target);
        urlstate.set_url();
    }
}

function add_tag_with_history(value) {
    add_tag(value);
    refresh_gallery();
    urlstate.set_url();
}

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

function add_tag_from_autocomplete(e, ui) {
    e.preventDefault();
    $('#tagfilter').val('');
    value = ui.item.value;
    add_tag_with_history(value);
}

function home() {
    $('#focusdiv').fadeOut(animation_speed);
    $('#gallerydiv').fadeOut(animation_speed, () => {
        $('#focusdiv').empty();
        urlstate.ids = [];
        urlstate.tags = [];
        urlstate.watch = false;
        delete urlstate.page;
        urlstate.set_url();
        $('#focusdiv').fadeIn();
        refresh_gallery();
    });
}

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
        maxwidth = $(window).width / 4
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

function clear_tags_click() {
    clear_tags();
    refresh_gallery();
    urlstate.set_url();
}

function clear_tags() {
    $('#taglist').empty();
    $('#cleartags').fadeOut(animation_speed);
    urlstate.tags = [];
}

function nav(target) {
    urlstate.page = $('#navigation').attr(target);
    urlstate.set_url();
    refresh_gallery();
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

function update_filename() {
  file = $('#id_image').val()
  fileName = file.split("\\");
  $('#filename').text(fileName[fileName.length - 1]);
}

function clear_form() {
    $('#formdiv').find("input[type=text], input[type=file], textarea").val('');
    $('#filename').text('No image selected.');
    $('#formerrordiv').empty();
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
        },

        error : function(xhr,errmsg,err) {
            $('#formerrordiv').empty();
            if (xhr.status === 400) {
                errobject = JSON.parse(xhr.responseJSON);
                for (k of Object.keys(errobject)) {
                    for (v of errobject[k]) {
                        console.log(v);
                        $('<p>' + v['message'] + '</p>')
                            .appendTo('#formerrordiv');
                    }
                }
            }
        }
    });
}
