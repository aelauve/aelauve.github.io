<script>
  $: prompt = "";
  $: sent = "display: none";

  function handleSubmit(event) {
    prompt = "display: none";
    sent = "";
  }
</script>

<main>
  <h1>Get in Touch!</h1>
  <section style={prompt}>
    <div class="cats" id="prompt">
      <img src="cats.png" alt="cats" />
    </div>
    <div class="contact-form">
      <form
        action="mailto:504alexise@gmail.com"
        method="post"
        enctype="text/plain"
        on:submit={handleSubmit}
      >
        <label for="name">Name</label>
        <input type="text" name="name" />

        <label for="email">E-Mail</label>
        <input type="text" name="email" />

        <label for="comment">Message</label>
        <textarea name="comment" cols="40" rows="5" />
        <br />
        <input type="submit" value="Send" id="send-btn" />
      </form>
    </div>
  </section>

  <section class="cats-sent" style={sent}>
    <img src="cats-sent.png" alt="cats" />
  </section>
</main>

<style>
  .cats {
    width: 50%;
    height: 100px;
    margin: 25px auto;
    display: flex;
    justify-content: center;
  }

  .cats-sent {
    width: 50%;
    height: 300px;
    margin: 25px auto;
    display: flex;
    justify-content: center;
  }

  img {
    height: 100%;
    display: block;
    margin: 0;
  }

  .contact-form {
    width: 50%;
    margin: 0 auto;
  }
</style>
