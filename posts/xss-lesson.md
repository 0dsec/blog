## what is reflected XSS?

Reflected Cross-Site Scripting (XSS) happens when a web application takes user input — usually from a URL parameter — and echoes it back into the page without sanitizing it first. If the input contains HTML or JavaScript, the browser executes it as if the developer wrote it themselves.

It's called "reflected" because the payload doesn't get stored anywhere. It bounces off the server and comes right back in the response. The classic scenario: a search page that says "showing results for: `<whatever you typed>`" by dumping your query straight into the HTML.

## how it works on a real server

In the real world, this is a server-side vulnerability. Imagine a PHP search page:

```php
<p>Results for: <?php echo $_GET['q']; ?></p>
```

Or a Node/Express route:

```js
res.send('<p>Results for: ' + req.query.q + '</p>');
```

The server takes the query parameter and writes it directly into the HTML response. The browser receives the full page, parses it top to bottom, and executes everything — including any `<script>` tags or event handlers the attacker injected into the query string.

The malicious URL might look like:

```
https://example.com/search?q=<script>alert(document.cookie)</script>
```

The victim clicks it, the server reflects the payload into the page source, and the browser runs it. Game over.

## try it yourself

This is a static site — there's no server to reflect off of. So the demo below simulates server-side reflection on the client. It uses the browser's HTML parser to process your input the same way a server-rendered page would: raw input goes in, the parser sees it as real markup, and everything executes.

Type something normal first and hit search — you'll see your input reflected in the results. Then try these:

```
<script>alert(1)</script>
```

```
<img src=x onerror=alert('XSS')>
```

```
<svg onload=alert('XSS')>
```

```
<b onmouseover=alert('hover')>hover over me</b>
```

```
<marquee onstart=alert('XSS')>gotcha</marquee>
```

They all work — `<script>` tags, event handlers, everything. That's exactly what happens when a server dumps unsanitized input into the page source.

## a note on the simulation

Since there's no backend here, the demo uses `document.createRange().createContextualFragment()` to parse your input. This API feeds raw HTML through the browser's parser the same way it would process markup in an initial page load — which is why `<script>` tags execute.

If this were using `innerHTML` instead (the more common client-side injection pattern), `<script>` tags would be blocked — that's an HTML5 mitigation. But event handler payloads like `onerror` and `onload` would still fire. That's a DOM-based XSS context, which is a different vulnerability class.

The real-world server-side version lets everything through, which is what this demo replicates.

## the vulnerable pattern

On a real server, the vulnerable code looks like this:

```js
res.send('<p>Results for: ' + req.query.q + '</p>');
```

The user's raw input gets concatenated into HTML and sent to the browser. The browser's parser treats it as part of the document source and executes all of it.

## the fix

```js
const escaped = escapeHtml(req.query.q);
res.send('<p>Results for: ' + escaped + '</p>');
```

Where `escapeHtml` converts `<` to `&lt;`, `>` to `&gt;`, `"` to `&quot;`, and `&` to `&amp;`. The angle brackets show up as literal characters instead of being parsed as markup.

On the client side, use `textContent` instead of `innerHTML`:

```js
results.textContent = 'Results for: ' + userInput;
```

Other defenses:

- **Content Security Policy (CSP)** — tell the browser which scripts are allowed to run, blocking inline script execution even if injection occurs
- **Use frameworks** — React, Vue, Angular all escape output by default (though you can bypass it with things like `dangerouslySetInnerHTML`)
- **Templating engines with auto-escaping** — Jinja2, EJS with `<%= %>`, Handlebars — all escape by default when configured correctly

## why it matters

In the real world, reflected XSS is used to:

- Steal session cookies and hijack accounts
- Redirect users to phishing pages
- Inject fake login forms that capture credentials
- Deface pages or inject cryptocurrency miners
- Perform actions on behalf of the victim (change their password, send messages, transfer funds)

The attacker crafts a malicious URL with the payload embedded in a query parameter. They send it to the victim via email, chat, or a shortened link. The victim clicks it, the server reflects the payload into the page, the browser executes it, and the attacker wins.

## key takeaways

- **Never trust user input.** Not in the URL, not in form fields, not in headers, not anywhere.
- **Always escape output.** On the server, escape HTML entities before writing user data into responses. On the client, use `textContent` over `innerHTML`.
- **`<script>` isn't the only payload.** Event handlers like `onerror`, `onload`, and `onmouseover` execute via `innerHTML` even though `<script>` tags don't. Don't filter for `<script>` and call it a day.
- **CSP is your safety net.** Even if you miss a spot, a strict Content Security Policy can block inline script execution.
- **XSS is everywhere.** It's OWASP A03:2021 and one of the most commonly reported vulnerabilities in bug bounty programs.

---

*If the browser trusts it, it runs it.*
