## Let's learn to manipulate a url!

There's a real vulnerability hiding on this blog right now, and by the end of this post you'll know exactly how to find it.

## the vulnerability: IDOR

**Insecure Direct Object Reference** is one of the most common web vulnerabilities in existence and at a base level its dead simple!

When a web application lets the user reference a resource by an id, usually a number or a short string, and the server doesn't check whether the user is actually allowed to see that resource, that is an IDOR.

## Example

Imagine you log in to your bank and view your latest statement. The URL looks like this:

```
https://myfuckingbank.com/statements?id=4821
```

Out of curiosity, you change `4821` to `4820` and hit you enter. If the server returns someone else's statement, then you just found an IDOR. And you could potentially enumerate every single statement in the bank's database by incrementing that number.

The fix is one check on the server: "does the currently logged in user actually own statement 4820?" If not, reject the request. That's it. But you'd be shocked how often that check is missing. (this will be a running theme with a lot of easy vulns lol)

## why it happens

Developers often assume that if a link isn't visible in the UI, users won't find it. This is called **security through obscurity**, and it's just straight up not security at all. A few things that commonly get developers in trouble:

- **Sequential IDs.** `?id=1`, `?id=2`, `?id=3` these are trivial to enumerate **(remember this!)**
- **Hidden admin pages** that are "only linked from the admin panel"
- **Soft-deleted records** that are hidden from lists but still fetchable by ID
- **Draft posts** that aren't listed anywhere but still render if you know the URL
- **Client-side filtering** that hides rows from a table but still sends the full data

The pattern is always the same. The server trusts the client to only ask for things it's supposed to see and you should NEVER trust a client to do anything you expect lol

## how to test for it yourself

The basic IDOR methodology is simple:

1. Find a page that takes an identifier in the URL or request body
2. Note what the current identifier is
3. Change it to a different value. Usually by incrementing or decrementing
4. See if you get data you weren't supposed to see

On a blog like this one, where posts are loaded via something like `post.html?id=5` this should be a no brainer.

## try it right now

Open any post on the main page using the "open in a new tab" button. Look at the URL. You'll see an `id` parameter at the end.

Now start changing the Id number!

Go low. Go high. Try numbers that don't correspond to any post you see on the index. The blog has a handful of visible posts and you've already seen them in the post list on the main page. So what happens if you request an ID that *isn't* listed on the front page? 

One thing I've personally done to find IDOR on **real** websites is I will open a bunch of pages listed on a particular drop down or link section and look at the first Id number that pops up. Sometimes it's some random starting number like `id=23805` and the next link might have the id `id=23806`. Open a bunch of links from the same section of the site and you may notice a pattern forming. It may look something like this.

- `id=23805`
- `id=23806`
- `id=23808`
- `id=23809`

Did you spot it? the id number `id=23807` is missing from the sequence. Now think to yourself, why would they choose to skip this id? Is there something associated with that Id that they don't want us to access? I actually used this very technique last week to find an IDOR on the website of an un-named township located in the US. I was able to find an exposed admin panel that was clearly not meant for public use. Even worse is this admin panel didn't even implement any form of rate limiting to prevent brute force login attempts (don't ask me how I know this, I definitely did not attempt to log in because that would be illegal lol)

Just like we talked about in our post about Broken Access Control, an IDOR is not **always** a critical find. But it absolutely can be and even when it's not, it often points to a loose adherence to best practices and a weak security posture. If you find one, it should trigger something in your brain that tells you to keep poking around until you find a thread worth pulling.

## what to take away

Start at `?id=1` and work up. Real attackers do it the same way, usually with automated tools that fire off hundreds of requests per second. For now though, it's good practice to do everything by hand. We will talk about automating shit in the future once you understand what is actually happening. No one likes a skid and it's important to actually learn this stuff if you ever want to graduate into becoming the next mr robot. In the future though, we will discus using pre-existing tools to automate workflows as well as coding our own custom tools which is another great way to learn about this stuff on a deeper level.

Either way, the point of this post isn't just to teach you one dumb trick. It's to train your instincts. When you see an identifier in a URL, your first thought should always be: *what happens if I change this?*

- **Never trust the URL bar.** The user owns it.
- **Never trust the client.** It lies.
- **Always enforce authorization on the server**, on every request, for every resource.
- **Sequential IDs are a red flag**, but UUIDs aren't a fix. They just slow down enumeration. The fix is the authorization check.

and always remember

*The address bar is an input field. Treat it like one.*

## contact

Reach me at `0dze@pm.me` or find me on [GitHub](https://github.com/0dsec).
