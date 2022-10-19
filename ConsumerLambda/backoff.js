const Backoff = (retries) => {
	// T() = interval * (exponentialRate)^^retryNumber
    // interval = 60 seconds
    // exponentialRate = 1.5
    const backoff = Math.pow(1.5, retries) * 60;
	return backoff;
}


module.exports = Backoff;
