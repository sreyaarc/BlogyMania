
const hamburger = document.querySelector(".hamburger");
hamburger.addEventListener("click", (e) => {
    const subNav = document.querySelector(".subNav");
    const newNavbar = document.querySelector(".navbar");
    const container = document.querySelector(".container");  // home page
    const newForm = document.querySelectorAll(".newForm");   // login and register page
    const username = document.querySelector(".username");    // account page

    // check if an element is successfully selected using querySelector before trying to access its classList. 
    // The ?. operator is used to conditionally access the classList property only if the element is successfully selected. 
    // This ensures that the code doesn't throw an error if any of the elements are not present in the DOM at the time the code runs.

    subNav?.classList.toggle("active");
    newNavbar?.classList.toggle("new");
    container?.classList.toggle("newCont");
    newForm?.[0]?.classList.toggle("formMargin");
    username?.classList.toggle("newUser");
    
});


const navbar = document.querySelector(".navbar");
window.onscroll = () => {
    if(document.body.scrollTop > 30|| document.documentElement.scrollTop > 30 ) {
        navbar.classList.add("navColored")
    } else {
        navbar.classList.add("navbar")
        navbar.classList.remove("navColored")
    }
}