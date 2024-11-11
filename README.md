# RBTC Audio Converter Backend

The backend for the RBTC Audio Converter.

## TODO

- [ ] Retry to connect to redis until it's successful HOW??
- [x] Add a job that deletes job files after 3 days
- [ ] On worker fail or error delete process folder or download folder
- [ ] Make download more secure with a authentication system
- [ ] Build in step by step logging for processFile
- [ ] Add authentication for admin route
- [ ] Add a route to remove all jobs and delete the uploads folder with
      authentication (flush)
- [ ] Add rollup to build project or any other building tool
- [ ] Add unit tests
- [ ] Rewrite to typescript
