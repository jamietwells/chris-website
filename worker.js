export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    // If visiting the root domain, serve the thirdcrossing index page
    if (url.pathname === "/" || url.pathname === "") {
      url.pathname = "/thirdcrossing/index.html";
      return env.ASSETS.fetch(new Request(url, request));
    }

    // For any other asset (CSS, JS, images), ensure it pulls from the /thirdcrossing/ folder
    if (!url.pathname.startsWith("/thirdcrossing/")) {
      url.pathname = "/thirdcrossing" + url.pathname;
    }

    return env.ASSETS.fetch(new Request(url, request));
  }
};
