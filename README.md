# ultimate-message-master

A Discord bot that supports Speech-to-Text and Text-to-Speech via Google's API.

## General Commands

By default, the bot monitors and speaks anything typed to it in the voice chat it is connected to.  Typed commands are prefixed with a ?.

#### ?rejoin
The bot will leave and reconnect to the voice chat.  This is helpful if something goes wrong.

### Text-to-Speech Commands

#### ?v &lt;country&gt; &lt;gender&gt;
Set your voice to a specific country and gender.

#### ?list
List all of the supported country accents.

#### ?clear
Remove any queued up Text-to-Speech requests except the one currently playing.

#### ?stop
Remove any queued up Text-to-Speech requests and stop the currently playing request.

#### ?queue
Show the number of Text-to-Speech requests in the queue.

#### ?current
Display your current country and gender selection for Text-to-Speech.

### Speech-to-Text Commands

#### ?follow
Tell the bot to transcribe everything you say in the voice chat the bot monitors.

#### ?unfollow
Tell the bot to stop transcribing everything you say in the voice chat the bot monitors.

### Image-to-Text Commands

#### ?score &lt;attachment&gt;
Experimental command for parsing and interpreting battle scores from the NSO Splatnet Battles screen.

### Commands to be implemented

#### ?help
Will eventually tell you how to use the bot (probably via DM).

#### ?meow
Bot will meow in the voice chat.

#### ?bark 
Bot will bark in the voice chat.

