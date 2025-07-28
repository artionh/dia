import axios from 'axios';

/**
 * NPM Registry API client with performance optimizations
 * Implements concurrent requests with proper rate limiting and caching
 */
class NpmRegistryClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || 'https://registry.npmjs.org';
    this.timeout = options.timeout || 10000;
    this.maxConcurrent = options.maxConcurrent || 10;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;

    // In-memory cache to avoid duplicate requests
    this.cache = new Map();
    this.pendingRequests = new Map();

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'dependency-impact-analyzer',
      },
    });
  }

  /**
   * Fetch package info for a single package
   */
  async fetchPackageInfo(packageName) {
    if (!packageName || typeof packageName !== 'string') {
      throw new Error('Package name must be a non-empty string');
    }

    const cacheKey = packageName.toLowerCase();

    // Return cached result if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Return pending request if already in progress
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // Create new request
    const requestPromise = this._fetchWithRetry(packageName)
      .then((data) => {
        this.cache.set(cacheKey, data);
        this.pendingRequests.delete(cacheKey);
        return data;
      })
      .catch((error) => {
        this.pendingRequests.delete(cacheKey);
        throw error;
      });

    this.pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }

  /**
   * Fetch package info for multiple packages with concurrency control
   */
  async fetchMultiplePackages(packageNames) {
    if (!Array.isArray(packageNames)) {
      throw new Error('Package names must be an array');
    }

    if (packageNames.length === 0) {
      return {};
    }

    const results = {};
    const errors = {};

    // Process packages in batches to control concurrency
    for (let i = 0; i < packageNames.length; i += this.maxConcurrent) {
      const batch = packageNames.slice(i, i + this.maxConcurrent);

      console.log('current batch:', batch);

      const batchPromises = batch.map(async (packageName) => {
        try {
          const packageInfo = await this.fetchPackageInfo(packageName);
          results[packageName] = packageInfo;
        } catch (error) {
          errors[packageName] = {
            error: error.message,
            code: error.code || 'UNKNOWN_ERROR',
          };
        }
      });

      await Promise.all(batchPromises);
    }

    return {
      results,
      errors,
      totalRequested: packageNames.length,
      totalSuccessful: Object.keys(results).length,
      totalFailed: Object.keys(errors).length,
    };
  }

  /**
   * Extract relevant package information
   */
  _extractPackageInfo(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid package data received');
    }

    const distTags = data['dist-tags'] || {};
    const versions = data.versions || {};
    const time = data.time || {};
    const latest = distTags.latest;

    return {
      name: data.name,
      description: data.description || '',
      latest: latest || null,
      versions: Object.keys(versions),
      publishedAt: time[latest] || null,
      repository: data.repository?.url || null,
      homepage: data.homepage || null,
      keywords: data.keywords || [],
      license: data.license || null,
      author: data.author || null,
      maintainers: data.maintainers || [],
      dependencies: versions[latest]?.dependencies || {},
      devDependencies: versions[latest]?.devDependencies || {},
      peerDependencies: versions[latest]?.peerDependencies || {},
      deprecated: data.deprecated || null,
    };
  }

  /**
   * Fetch with retry logic
   */
  async _fetchWithRetry(packageName, attempt = 1) {
    try {
      const encodedName = encodeURIComponent(packageName);
      const response = await this.client.get(`/${encodedName}`);

      if (response.status === 200 && response.data) {
        return this._extractPackageInfo(response.data);
      }

      throw new Error(`Unexpected response status: ${response.status}`);
    } catch (error) {
      if (attempt >= this.retryAttempts) {
        // Handle specific error cases
        if (error.response?.status === 404) {
          throw new Error(`Package "${packageName}" not found`);
        }
        if (error.response?.status === 429) {
          throw new Error(`Rate limit exceeded for package "${packageName}"`);
        }
        if (error.code === 'ECONNABORTED') {
          throw new Error(`Request timeout for package "${packageName}"`);
        }

        throw new Error(`Failed to fetch package "${packageName}": ${error.message}`);
      }

      // Exponential backoff
      const delay = this.retryDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));

      return this._fetchWithRetry(packageName, attempt + 1);
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
    };
  }
}

export default NpmRegistryClient;
