## what is reflected XSS?

Reflected Cross-Site Scripting (XSS) happens when a web application takes user input, usually from a URL parameter, and echoes it back into the page without sanitizing it first. If the input contains HTML or JavaScript, the browser executes it as if the developer wrote it themselves.

It's called "reflected" because the payload doesn't get stored anywhere. It bounces off the server and comes right back in the response. The classic scenario: a search page that says "showing results for: `<whatever you typed>`" by dumping your query straight into the HTML of the page.

## how it works on a real server

In the real world, this is a server-side vulnerability. Imagine a PHP search page:

```php
<p>Results for: <?php echo $_GET['q']; ?></p>
```

Or a Node/Express route:

```js
res.send('<p>Results for: ' + req.query.q + '</p>');
```

The server takes the query parameter and writes it directly into the HTML response. The browser receives the full page, parses it top to bottom, and executes everything, including any `<script>` tags or event handlers the attacker injected into the query string.

The malicious URL might look like:

```
https://example.com/search?q=<script>alert(document.cookie)</script>
```

The victim clicks it, the server reflects the payload into the page source, and the browser runs it. Game over.


## the vulnerable pattern

On a real server, the vulnerable code looks like this:

```js
res.send('<p>Results for: ' + req.query.q + '</p>');
```

The user's raw input gets concatenated into HTML and sent to the browser. The browser's parser treats it as part of the document source and executes all of it.

## how to spot a potential xss sink

One of the easiest ways to identify a possible XSS vulnerability is simple, type something into a search box (or any input), submit it, and look at how the page responds.

If the site shows your exact input back to you, for example:
`Results for: test123`


That means your data is being reflected into the page.

That alone isn’t a vulnerability. Modern frameworks escape output by default, so even if your input is reflected, it might be rendered safely as plain text.

The red flag is **how** it’s reflected.

---

## extra signal: instant reflection

Another thing to pay attention to is when your input shows up. If you type into a field and your input appears on the page immediately, without a page reload, that usually means JavaScript is updating the page dynamically in your browser.

This is important because it often indicates client-side rendering, which can introduce a different class of bugs known as DOM-based XSS. (separate post about this vuln in the future!)

In these cases, your input might be getting inserted into the page using JavaScript functions like:

`innerHTML`
`insertAdjacentHTML`
`document.write`

If those are used unsafely, they can become true XSS sinks.

On the other hand, if the page reloads and then shows your input, the reflection is likely happening on the server side instead. Both scenarios are worth testing—the key difference is where the data is being handled.

---

## how it’s rendered

Once you know where the input is handled, the next step is to figure out how it’s rendered. If your input is inserted into the page in a way that looks like raw HTML (not escaped), you may have found a potential XSS sink.

A quick way to probe this is to slightly modify your input:

- Try adding characters like `<` and `>`
- See if they show up as is, or get converted to `&lt;` and `&gt;`

If the browser treats your input as actual markup instead of text, that’s when the red flags start to fly. A page that writes user input into the page as raw HTML without proper escaping is worth investigating further.

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

- **Content Security Policy (CSP):** tell the browser which scripts are allowed to run, blocking inline script execution even if injection occurs
- **Use frameworks**: React, Vue, Angular all escape output by default (though you can bypass it with things like `dangerouslySetInnerHTML`)
- **Templating engines with auto-escaping**: Jinja2, EJS with `<%= %>`, Handlebars should all escape by default when configured correctly

## why it matters

In the real world, reflected XSS is used to:

- Steal session cookies and hijack accounts
- Redirect users to phishing pages
- Inject fake login forms that capture credentials
- Deface pages or inject cryptocurrency miners
- Perform actions on behalf of the victim (change their password, send messages, transfer funds)
- to be funny

The attacker crafts a malicious URL with the payload embedded in a query parameter. They send it to the victim via email, chat, or a shortened link. The victim clicks it, the server reflects the payload into the page, the browser executes it, and the attacker is all :]

## key takeaways

- **Never trust user input.** We've already covered this on previous posts but the same thing applies here. DO NOT TRUST THE USER!
- **Always escape output.** On the server, escape HTML entities before writing user data into responses. On the client, use `textContent` over `innerHTML`.
- **`<script>` isn't the only payload.** Event handlers like `onerror`, `onload`, and `onmouseover` execute via `innerHTML` even though `<script>` tags don't. Don't filter for `<script>` and call it a day. Have some fun with weird EH's. There is a LOT of them!
- **CSP is your safety net.** Even if you miss a spot, a strict Content Security Policy can block inline script execution.
- **XSS is everywhere.** It's OWASP A03:2021 and one of the most commonly reported vulnerabilities in bug bounty programs.

## try it yourself

This is a static site, so technically there's no server to reflect off of. So the demo below simulates server-side reflection on the client. It uses the browser's HTML parser to process your input the same way a server-rendered page would. Raw input goes in, the parser sees it as real markup, and everything executes.

Type something normal first and hit search, you'll see your input reflected in the results. Then try these payloads:

```
<script>alert('ayyy! XSS ACHIEVED! :]')</script>
```

```
<img src=x onerror=alert('hahahahahahaha')>
```

```
<b onmouseover=alert('GOTCHA!')>hover over me</b>
```

```
<marquee onstart=alert('XSS')>this should not be happening right now lol</marquee>
```

There are massive lists of payloads you can execute on various websites. I'll link some below. In the future I'll do another post about XSS where we talk about specific payloads and why certain ones work in certain contexts. We will also cover things like automating XSS with python and selenium as well as taking a look at some github repos for other peoples automation solutions. Have fun :]

RESOURCES!

- [PortSwigger Web Security Academy — Cross-site scripting (XSS)](https://portswigger.net/web-security/cross-site-scripting)
- [OWASP — Cross Site Scripting (XSS)](https://owasp.org/www-community/attacks/xss/)
- [OWASP Top 10 2025 — A03 Injection](https://owasp.org/Top10/2025/A03_2025-Injection/)
- [Hack The Box Academy — Cross-Site Scripting (XSS)](https://academy.hackthebox.com/course/preview/cross-site-scripting-xss)
- [TryHackMe — Intro to Cross-site Scripting](https://tryhackme.com/room/xss)
- [PayloadBox — XSS Payload List (GitHub)](https://github.com/payloadbox/xss-payload-list)
- [PortSwigger XSS Cheat Sheet (Interactive Payloads)](https://portswigger.net/web-security/cross-site-scripting/cheat-sheet)

## XSS DEMO BELOW!!!