# HeapSong

I wrote an heap visualizer written using cursor, and then re-wrote the code to make it maintainable.

![Screenshot](public/screenshot.png)

json input format:

```
[
    {
        "type": string,
        "address": hex string,
        "size": hex string,
        "actualSize": hex string,
        "color": color string for js,
        "groupId": int,
        // Can add extra properties for search
    },
    ...
]
```

See [sample](public/sample-heap.json) for a sample.
