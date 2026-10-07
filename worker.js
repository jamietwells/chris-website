export default {
  async fetch(request) {
    const url = new URL(request.url);

    url.hostname = "threetwosix.co.uk";

    if (url.pathname === "/") {
      url.pathname = "/thirdcrossing/";
    } else {
      url.pathname = "/thirdcrossing" + url.pathname;
    }

    const newHeaders = new Headers(request.headers);
    newHeaders.set("Host", "threetwosix.co.uk");

    const modifiedRequest = new Request(url, {
      headers: newHeaders,
      method: request.method,
      body: request.body,
      redirect: "follow"
    });

    return fetch(modifiedRequest);
  }
};
