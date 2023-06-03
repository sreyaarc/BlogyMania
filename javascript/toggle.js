// const toggleBtn = document.querySelector(".toggle");
// toggleBtn.addEventListener("click", (e) => {
//     const contents = toggleBtn.parentElement.children;
//     // console.log(contents)
//     contents.className = "contentToggle";
    
// })

const navbar = document.querySelector(".navbar");
window.onscroll = () => {
    if(document.body.scrollTop > 30|| document.documentElement.scrollTop > 30 ) {
        navbar.classList.add("navColored")
    } else {
        navbar.classList.add("navbar")
        navbar.classList.remove("navColored")
    }
}