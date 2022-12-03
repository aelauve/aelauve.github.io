<script>
  import Banner from "./components/Banner.svelte";
  import Nav from "./components/Nav.svelte";
  import Footer from "./components/Footer.svelte";
  import About from "./components/About.svelte";
  import Web from "./components/Web.svelte";
  import Ios from "./components/ios.svelte";
  import Backend from "./components/Backend.svelte";
  import Resume from "./components/Resume.svelte";
  import Contact from "./components/Contact.svelte";
</script>

<main>
  <Nav />
  <a id="about-section"><About /></a>
  <a id="web-section"><Web /></a>
  <a id="ios-section"><Ios /></a>
  <a id="backend-section"><Backend /></a>
  <a id="resume-section"><Resume /></a>
  <a id="contact-section"><Contact /></a>
  <Footer />
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
