$(document).ready(function($) {

    // set panel min-height to full browser height   
    $(window).bind("load resize", function(){
        var h = $(window).height();
        $("#wrapper, #grid, #navBg").css({ "min-height" : (h) });
        $("#content").css({ "min-height" : (h-147) });
    });
    
    // toggle grid
    
    $("#grid").hide();

    $(document.documentElement).keyup(function (event) {
        if (event.keyCode == 71) {
            $("#grid").fadeToggle(100);
        }
    });
    
    // if window is larger than #nav then #nav == fixed, if #nav is larger than window #nav == relative
    $(window).bind("load resize", function(){
        var w = jQuery(window).height();
        var h = jQuery('#nav').outerHeight();
        jQuery("#nav").css("position",(w < h) ? ("relative") : ("fixed"));
    });

    // done!
});  
