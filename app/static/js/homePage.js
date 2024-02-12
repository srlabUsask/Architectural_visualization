
jQuery( document ).ready(function() {
   // jQuery('#view').css('display',"none")
    hideNavBar();
});




/*
function attached to arrow of navbar
hides/shows the bars on click
 */
function hideNavBar(){
    let view = jQuery('#view')

    jQuery("#navBar .navCollapseButton").on('click', (e)=>{

        jQuery("#navBar .nabBarCollapse").slideToggle(400);
        const arrow = jQuery('#navBar .navCollapseButton i');
        jQuery('#navBar').toggleClass("opacity-75")

        arrow.toggleClass('navToggled')
        arrow.toggleClass('fa-angle-up')
        arrow.toggleClass('fa-angle-down')

    })

}

