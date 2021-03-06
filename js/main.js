$(document).ready(function(){
  $(".nav-item").click(function () {
    $("a.active").removeClass('active');
    $(this).addClass('active');
    var active_section = $(this).attr('href'); //get active section id
    $('html, body').animate({
    //and scroll to the section
    scrollTop: $(active_section).offset().top
    }, 1000);
  });
  
  $(".workbutton").mouseover(function () {
    const onImage = $(this).find('img').attr('src');
    $(this).find('img').attr('src', onImage.split('_')[0] + '_on.png');
  });
  $(".workbutton").mouseout(function () {
    const offImage = $(this).find('img').attr('src');
    $(this).find('img').attr('src', offImage.split('_')[0] + '_off.png');
  });


 $(document).scroll(function () {
 //get document scroll position
   var position = $(document).scrollTop(); 
   //get header height
   var header = $('nav').outerHeight();
   
   //check active section
   $('.section').each(function(i) {
       if($(this).position().top <= (position + header))
        {
             $("a.active").removeClass('active');
             $("a").eq(i).addClass('active');
        }
    });
 }); 

});