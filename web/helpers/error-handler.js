// this function manages shopify api rate limiting errors
// pass the function with shopify request and
// arguments (whatever things used inside the function and declared outside)

const shopifyErrorHandler = async (work, ...people) => {
  let working = true;
  while (working) {
    try {
      const result = await work(...people);
      return result;
    } catch (error) {
      // wait if the error is caused by graphql request limit rate
      const queryCost = error?.response?.extensions?.cost;
      if (
        queryCost?.throttleStatus?.currentlyAvailable <
        queryCost?.requestedQueryCost
      ) {
        const diff =
          queryCost.requestedQueryCost -
          queryCost.throttleStatus.currentlyAvailable;
        const waitTime = (diff * 1000) / queryCost.throttleStatus.restoreRate;
        await sleep(waitTime);
        continue;
      }

      // wait if the error if cause by rest api
      const retryAfter = error?.response?.retryAfter;
      if (retryAfter) {
        await sleep(retryAfter * 1000);
        continue;
      }

      // return the error if it's not rate limit
      throw error;
    }
  }
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export default shopifyErrorHandler;
