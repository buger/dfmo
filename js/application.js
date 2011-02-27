var html = "", style = "";

for (var i=0; i<18; i++) {

    
    html += '<div class="company" data-index="'+i+'">\
                <div class="image logo_s_'+i+'"></div>\
                <div class="title">Company '+i+'</div>\
            </div>'   
            
    style += ".logo_s_"+i+" { background-image:url('images/logo_s_"+i+".jpg'); }";
}

var container = document.getElementById("companies").childNodes[3];
container.innerHTML += html;
container.innerHTML += "<style>"+style+"</style>";

function loadCompany(index) {
    var logo;
    
    $('.info .about').hide()
    
    if (index === undefined) {
        logo = "images/logo.png"; 
        $('#back').hide();
         $('.info .about.home').show();
    } else {
        logo = "images/logo_"+index+".png";
        $('#back').show();
        $('.info .about.'+index).show();
    }
    
    console.log(logo);
    
    $('.info .picture').css({'backgroundImage': 'url('+logo+')'});
}

$('.company').live('click', function(){
    var index = $(this).data('index');
    
    loadCompany(index);
});

$('#back').live('click', function(){
    loadCompany();
})