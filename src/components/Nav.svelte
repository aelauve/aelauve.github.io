<script>
  import Search from "./Search.svelte";
  import NavItem from "./NavItem.svelte";
  let src = "logo-small.png";
  let alt = "logo";
</script>

<main>
  <div class="logo">
    <img {src} {alt} />
  </div>
  <div class="nav-search">
    <nav>
      <NavItem href="#about-section" label="About" />
      <NavItem href="#web-section" label="Web" />
      <NavItem href="#ios-section" label="iOS" />
      <NavItem href="#backend-section" label="Backend" />
      <NavItem href="#resume-section" label="Resume" />
      <NavItem href="#contact-section" label="Contact" />
    </nav>
    <div class="search"><Search /></div>
  </div>
</main>

<style>
  main {
    margin-top: 10px;
    display: flex;
    align-items: center;
    height: 80px;
    /* border: 2px black solid; */
    padding: 10px;
    font-family: "Courier New", Courier, monospace;
    /* position: -webkit-sticky;
    position: sticky;
    top: 0; */
  }

  nav {
    display: flex;
    background-color: rgba(34, 35, 36, 0.4);
    padding: 20px;
    text-align: center;
    border-radius: 30px;
  }

  img {
    max-width: 80%;
    max-height: auto;
  }

  .logo {
    margin-right: 20px;
    width: 150px;
  }

  .search {
  }

  .nav-search {
    width: 100%;
    /* border: 2px black solid; */
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 30px;
  }
</style>
