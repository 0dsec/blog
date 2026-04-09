## What is Broken Access Control

Hi :]

Today I will teach you how to hack a website.

More specifically I will teach you one "low hanging fruit" vuln that you may encounter in the wild. This low hanging fruit is called "Broken Access Control".

When a developer doesn't want you to access a certain part of a website there are many ways they may go about keeping you out. One of these ways looks a little something like this:

A site presents you with a button that the developer didn't want you to click. The button was disabled in the HTML like so:

```html
<button class="tag-btn locked" disabled>LOCKED</button>
```

The button appears greyed out and unclickable on the page.

If this is the only thing preventing us from gaining access then that is a problem.

That `disabled` attribute is **client-side only**. It tells the browser to grey out the button and ignore clicks, but it doesn't actually stop anything from happening on the server. The data was always there. The filter logic was always there. The only thing standing between you and the "locked" content is a single HTML attribute that the browser owner (you) controls.

All it would take for you to access this content is to open your developer tools and click inspect element. You look for something that looks like:

```html
<button class="tag-btn locked" disabled>LOCKED</button>
```

and you simply delete the `disabled` attribute. Done. lol. For real thats the hack. Lets clarify what is happening here. This vulnerability is reliant on a lack of server side validation. If the server never actually checks whether you have permission to view the content, the only thing stopping you from accessing it is HTML running in your own browser, that YOU control. 

Now, there can absolutely still be server side validation checks behind this button press. But we still check this to make sure that access is not simply being gated by client side HTML. And to be honest even with a server side validation check, its probably best practice to just not even render the button for users who don't need access to it in the first place. 

A good mind set for a hacker to have in this situation is "finding a greyed out button doesn't 100% guarantee I can get in. However, the fact that it's there for me to inspect in the first place may hint at loose adherence to best practices and may lead to finding a real bug in the code base. Lets poke it with a stick and see what happens."

## Hack this website!

Now! you may have noticed in the tags of this very website, there is a tag labeled `"LOCKED"`. Try to take the information I just gave you and see if you can access the locked posts on this website. As of the writing of this post there should be only one post with the `"LOCKED"` tag but who knows, maybe i'll get bored one day and add some more content behind the BAC wall. For now though, give it a shot! If you make it to the other side shoot me an email @ `0dze@pm.me` with the hidden passphrase to let me know you made it! 

In the future I will make a level 2 BAC post going into other more advanced methods of exploiting BAC in real world scenarios. Right now, I am currently working on a post about Cross Site Scripting (XSS) as part of a series of posts on beginner friendly vulns for people just getting started in web app hacking. Once I've showed off a few "lvl 1" vulns we will dig deeper and talk about using tools like burp suite to really step up our game. So look forward to more hacking tutorials w/ real live demos right here on `0dze.sh`!

## contact

Reach me at `0dze@pm.me` or find me on [GitHub](https://github.com/0dsec).