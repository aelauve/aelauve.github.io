<script></script>

<main>
  <h1>Resume</h1>
  <section class="resume">
    <div class="background" />
    <div class="doc">
      <iframe title="resume" src="resume.pdf" frameborder="0" />
    </div>
  </section>
</main>

<style>
  .resume {
    width: 50%;
    height: auto;
    display: grid;
    grid-template-columns: 250px 1fr;
    grid-template-rows: 150px 1fr;
  }

  .background {
    background: linear-gradient(
      335deg,
      rgba(255, 140, 107, 1) 0%,
      rgba(255, 228, 168, 1) 100%
    );
    border-radius: 30px;
    background-repeat: no-repeat;
    height: 200px;
    width: 100%;
    grid-area: 1/1/2/2;
  }

  .doc {
    background-color: blue;
    margin-left: 200px;
  }

  iframe {
    width: 90%;
    height: 200px;
    border-radius: 10px;
    background-color: white;
    border: none;
  }
</style>
