# HeapSong

I wrote an heap visualizer written using cursor, and then re-wrote the code to make it maintainable.

![Screenshot](public/screenshot.png)

json input format:

```
[
    {
        "type": string,
        "address": hex string or int,
        "size": hex string or int,
        "actualSize": hex string or int,
        "color": color string for js,
        "groupId": int,
        // Can add extra properties for search
    },
    ...
]
```

See [sample](public/sample-heap.json) for a sample.

## TODO

[ ] Convert usage from number to BigInteger to support kernel addresses
[ ] Improve visualization of small entries
