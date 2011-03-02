function loadCompany(index) {
    var logo;
    
    $('.info').hide()
    
    if (index === undefined) {
        logo = "images/logo.png"; 
        $('#back').hide();
         $('.info.home').show();
    } else {
        logo = "images/logo_"+index+".png";
        $('#back').show();
        $('.info.'+index).show();
    }
}

function toggleContacts(index) {
    var container = index ? $('.info.'+index) : $('.info.home');
    
    container.find('div.text, a.contacts').toggle();
    container.find('div.contacts, a.back').toggle();
}

$(document).ready(function(){
    $('.company').live('click', function(){
        var index = $(this).data('index');
        
        loadCompany(index);
    });

    $('#back').live('click', function(){    
        loadCompany();
    });
});
