export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // Set the target hostname
    url.hostname = "threetwosix.co.uk";
    
    // Prepend "/thirdcrossing" to the path so it points to the correct folder/site
    if (url.pathname === "/") {
      url.pathname = "/thirdcrossing/";
    } else {
      url.pathname = "/thirdcrossing" + url.pathname;
    }

    // Forward the request to the target site while preserving headers, method, etc.
    const modifiedRequest = new Request(url, {
      headers: request.headers,
      method: request.method,
      body: request.body,
      redirect: "follow"
    });

    // Fetch the content and return it to the visitor
    return fetch(modifiedRequest);
  }
};
