export function ClosePreload() {
    gsap.to(".Preload", {
        duration: 2,
        delay: .5,
        opacity: 0,
        ease: Power4.easeInOut
    });

    setTimeout(function() {
        document.querySelector(".Preload").remove();
        document.body.classList.toggle("lockScroll")
    }, 2100)
}

export function ScheduleTrackDown() {
    gsap.fromTo(".schedule_wrapper", {top: "0%"}, {
        duration: 1.5,
        top: "100%",
        ease: Power4.easeInOut
    });
}

export function ScheduleTrackUp() {
    gsap.fromTo(".schedule_wrapper", {top: "100%"}, {
        duration: 1.5,
        top: "0%",
        ease: Power4.easeInOut
    });
}

var start_animation = gsap.timeline({scrollTrigger:{
    trigger: ".Schedule",
    start: "0% 100%",
    end: "100% 100%",
    scrub: .5,
    snap: 1
}});

start_animation.fromTo(".Start", {opacity: "100%", top: "0%"}, {opacity: "0%", top: "10%"}, 'a')
.fromTo(".Schedule", {opacity: "0%"}, {opacity: "100%"}, 'a')
