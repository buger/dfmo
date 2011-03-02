function getPageLanguage(){
    return $('meta[http-equiv="content-language"]').attr('content');
}

function convertText(text) {
    text = text.replace(/\n/g,'<br/>');
    text = text.replace(/http:\/\/[\w.]+/gi,"<a href='$&'>$&</a>");

    return text
}

$('html').addClass('js');

function getImageUrl(node) {
    var url;

    if (node.nodeName == 'IMG') {
        url = node.src;
    } else if(node.nodeName == 'A') {
        url = node.href;
    } else {
        try {
            url = node.style.backgroundImage.replace('url(','').replace(')','');
        } catch(e) {
            return ""
        }
    }
    
    url = url.replace(/\?.*/,'').replace(/'/,'').replace('"','');

    return url
}

function setImageUrl(node, src) {
    if (node[0])
        node = node[0];
        
    if (node.nodeName == 'IMG') {
        node.src = src;
    } else if (node.nodeName == 'A') {
        node.href = src;
    } else {
        node.style.backgroundImage = "url("+src+")";
    }
}

$(document).ready(function(){    
    if (!window.navigator.userAgent.match(/(Chrome|Mozilla)/)) {
        $('#admin-panel').html('Your browser is not supported. Use Chrome or Firefox');
        return false;
    }

    $('html').addClass('admin');

    $('.editable').each(function() {
        try {
        var re = "<!--msg_id:(.*)-->";
        var message_id = this.innerHTML.match(re)[1];                    
        $(this).data('msg_id', message_id);

        this.innerHTML = this.innerHTML.replace(re,'');

        $(this).attr('contenteditable', true);
        } catch (e) {}
    }).live('blur', function(){        
        this.innerHTML = convertText(this.innerText || this.textContent);
    });

    $('#save_page').live('click', function() {
        this.value = 'Saving...'

        var messages = {};
        var files = {}

        $('.editable').each(function() {
            var message_id = $(this).data('msg_id');                    
            if (message_id) {
                messages[message_id] = convertText(this.innerText || this.textContent);
            }
        });        

        $('.editable_image, .editable_file').each(function() {
            var file_id = $(this).data('file_id');                    

            if (file_id) {                                
                files[file_id] = getImageUrl(this);
            }
        });        

        
        $.ajax({
            type: 'POST',
            url: '/admin/update',
            data: {
                messages: JSON.stringify(messages),
                language: getPageLanguage(),
                files: JSON.stringify(files)
            }
        }).error(function(){
            alert('Error while saving. Try again');    
        }).success(function(){
            $('#save_page').val('Save Changes').attr('disabled', false);    
        });
    });    
    
    $('#add_company').live('click', function() {
        if (confirm('Please save your changes, before adding new Company. Page will be reloaded. Continue?')) {
            return true;
        } else {
            return false;
        }
    });

    $('.editable_image, .editable_file').each(function(){        
        var image = $(this);
        var isFile = image.hasClass('editable_file');

        try {
            if (image[0].nodeName === 'IMG') {
                var file_id = image[0].src.match(/file_id=([\w_]+)/)[1];
            } else {
                if (isFile) {
                    var file_id = image[0].href.match(/file_id=([\w_]+)/)[1];
                } else {
                    var file_id = image[0].style.backgroundImage.match(/file_id=([\w_]+)/)[1];
                }
            }
        } catch(e) {
        }

        var offset = image.offset();

        image.data('file_id', file_id);

        var link = $("<a class='edit_image' title='Change Image'></a>")        
            .bind('click', function(){
                showFileChooser(image)       
            });

        if (isFile || image[0].nodeName === 'IMG') {
            link.appendTo(document.body)
                .css({top: offset.top-16, left:offset.left});
        } else {
            link.appendTo(image)
                .css({top: -16, left:0});
        }
    });
    
    $('#upload_files').live('change', function(evt) {
        var files = this.files;

        if (files.length > 0) {
            $.getJSON('/admin/upload_url', function(urls){
                var xhr = new XMLHttpRequest()
 
                xhr.upload.addEventListener('progress', function(evt){
                    var percent = evt.loaded/evt.total*100;
                    $('#progress').html('Progress '+parseInt(percent)+'%');
                }, false);

                xhr.onreadystatechange = function(){
                    if (xhr.readyState === 4) {
                        $('#progress').html('Files uploaded!');
                    }
                }
                
                $('#progress').html('Uploading files...');

                xhr.open('POST', urls[0], true);
               
                if (window.FormData) {
                    var f = new FormData();
                    for (var i=0; i < files.length; i++) {
                        f.append('file_'+i, files[i]);
                    }
                    
                    xhr.send(f);
                } else {
                    var boundary = '------multipartformboundary' + (new Date).getTime();
                    var dashdash = '--';
                    var crlf     = '\r\n';

                    /* Build RFC2388 string. */
                    var builder = '';

                    for (var i=0; i< files.length; i++) {
                        builder += dashdash;
                        builder += boundary;
                        builder += crlf;

                        builder += 'Content-Disposition: form-data; name="file_'+i+'"';
                        builder += '; filename="' + files[i].fileName + '"';
                        builder += crlf;

                        builder += 'Content-Type: '+files[i].type;
                        builder += crlf;
                        builder += crlf;

                        /* Append binary data. */
                        builder += files[i].getAsBinary();
                        builder += crlf;
                    }

                    /* Write boundary. */
                    builder += dashdash;
                    builder += boundary;
                    builder += dashdash;
                    builder += crlf;

                    
                    xhr.setRequestHeader('content-type', 'multipart/form-data; boundary=' + boundary);
                    xhr.sendAsBinary(builder);
                }
            });
        }
    });
});

function showFileChooser(image) {    
    var offset = image.offset();

    var loader = $("<div class='file_loader filtered'>Loading</div>")        
        .css({top: offset.top-20, left:offset.left-20})
        .appendTo(document.body);
    
    media_type = image.hasClass('editable_file') ? "file" : "image"

    $.getJSON('/admin/list_media?type='+media_type, function(media) {
        var filter = image.data('image-filter');

        items = [];    

        isFiltered = false;

        media.forEach(function(image){
            var cssClass = "";
            if (filter && filter.width && image.width > filter.width) {
                cssClass = 'hidden';    
                isFiltered = true;
            }
            
            if (media_type == "image") {
                items.push('<img src="/media/'+image.src+'" class="'+cssClass+'" />');
            } else {
                items.push('<a href="/media/'+image.src+'" class="file">'+image.filename+'</a><br/>');
            }
        });               
        
        links = "<a href='javascript:void' class='close'>Close</a>";
        if (isFiltered) {
            links += "&nbsp;<a href='javascript:void' class='show_all'>Show All</a>"
        }
        links += "<br/>"

        loader.html(links+items.join(''));
        loader.find('img,a.file').bind('click', function(){
            if (media_type == "file") {
                setImageUrl(image, this.href);
            } else {
                setImageUrl(image, this.src);
            }

            loader.remove();

            return false;
        });
        loader.find('.show_all').bind('click', function(){
            loader.removeClass('filtered');
            $(this).remove();
        });
        loader.find('.close').bind('click', function(){
            loader.remove();
        });


    }).error(function(){
        alert('Try again');
        loader.remove();    
    });
}
