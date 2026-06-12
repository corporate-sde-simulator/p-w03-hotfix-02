# Beginner Explanatory Guide: PLATFORM-2872: Fix LRU Cache Eviction Bug

> **Task Type**: Product Task  
> **Domain/Focus**: Caching Algorithms, TypeScript Fundamentals

---

## 1. The Goal (In-Depth Beginner Explanation)

### The Core Problem
The task at hand addresses a critical bug in the implementation of an LRU (Least Recently Used) cache. An LRU cache is designed to efficiently manage memory by evicting the least recently accessed items when it reaches its capacity. However, in this case, the current implementation mistakenly evicts the most recently used item instead of the least recently used one. This flaw leads to a significant drop in cache hit rates, meaning that frequently accessed data is being removed from the cache, resulting in slower performance and increased load times for users.

Additionally, the cache's size tracker is malfunctioning; it can report negative values after evictions. This occurs because while the size is decremented when an item is evicted, the actual entries are not being removed from the internal data structure (a Map). This inconsistency can lead to confusion and errors in the application, as developers and users expect the cache size to accurately reflect the number of items stored. Fixing these issues is crucial for maintaining optimal performance and reliability in the application, ensuring that users have quick access to the data they need.

### Jargon Buster (Key Terms Explained)
* **LRU Cache**: An LRU cache is a data structure that stores a limited number of items and removes the least recently used item when it reaches its capacity. For example, if a cache can hold three items and the items accessed are A, B, and C in that order, when a fourth item D is added, A will be removed because it was the least recently accessed.

* **Eviction**: Eviction refers to the process of removing an item from the cache to make space for new items. In the context of an LRU cache, this process should remove the least recently used item. For instance, if the cache contains items A, B, and C, and item D is added, the cache will evict item A if it is full.

* **Cache Hit Rate**: This is a metric that indicates how often requested data is found in the cache. A high cache hit rate means that most requests are served from the cache, leading to faster response times. For example, if a cache serves 80 out of 100 requests from stored data, the cache hit rate is 80%.

* **Map**: In programming, a Map is a collection of key-value pairs where each key is unique. It allows for efficient retrieval of values based on their keys. For example, in a Map storing user data, the user's ID could be the key, and the user's information could be the value.

### Expected Outcome
After implementing the necessary fixes, the LRU cache should correctly evict the least recently used item when it reaches its capacity, ensuring that frequently accessed items remain available. The size tracker should accurately reflect the number of items in the cache, never reporting negative values. Additionally, the `get()` method should mark items as recently used, updating their position in the cache accordingly. 

**Before vs. After**:
- **Before**: The cache evicts the most recently used item, leading to a cache hit rate of only 12% and a size tracker that can report negative values.
- **After**: The cache correctly evicts the least recently used item, achieving a cache hit rate above 80% and maintaining an accurate size tracker.

---

## 2. Related Coding Concepts & Syntax

### Concept 1: Caching Mechanisms
#### 📘 Theoretical Overview (50%)
Caching is a technique used to store frequently accessed data in a temporary storage area (the cache) to improve performance. When data is requested, the system first checks the cache to see if the data is available. If it is, this is known as a "cache hit," and the data can be retrieved quickly. If the data is not in the cache, this is a "cache miss," and the system must retrieve the data from a slower source, such as a database or an external API.

The LRU caching mechanism specifically tracks the order of access to items in the cache. When the cache reaches its capacity, it evicts the least recently used item to make space for new data. This ensures that the most frequently accessed data remains available, optimizing performance and reducing latency.

#### 💻 Syntax & Practical Examples (50%)
* **Language Syntax**:
  ```typescript
  class LRUCache {
      private cache: Map<string, any>;
      private capacity: number;

      constructor(capacity: number) {
          this.capacity = capacity;
          this.cache = new Map();
      }

      get(key: string): any {
          if (this.cache.has(key)) {
              const value = this.cache.get(key);
              // Move to front logic here
              return value;
          }
          return -1; // Cache miss
      }

      put(key: string, value: any): void {
          if (this.cache.has(key)) {
              this.cache.set(key, value);
              // Move to front logic here
          } else {
              if (this.cache.size >= this.capacity) {
                  // Eviction logic here
              }
              this.cache.set(key, value);
          }
      }
  }
  ```

* **Real-World Application**:
  ```typescript
  const cache = new LRUCache(3);
  cache.put("A", 1); // Cache: {A: 1}
  cache.put("B", 2); // Cache: {A: 1, B: 2}
  cache.put("C", 3); // Cache: {A: 1, B: 2, C: 3}
  cache.get("A");    // Returns 1, Cache: {B: 2, C: 3, A: 1}
  cache.put("D", 4); // Evicts B, Cache: {C: 3, A: 1, D: 4}
  ```

---

## 3. Step-by-Step Logic & Walkthrough

1. **Step 1: Locate and Analyze the Target File**
   * Navigate to the `p-w03-hotfix-02` folder and open the `lruCache.ts` file.
   * Focus on the `put` method, specifically lines where the cache size is managed and items are evicted.

2. **Step 2: Input Verification & Validation**
   * Check if the `key` and `value` parameters in the `put` method are valid (not null or undefined).
   * Ensure that the cache's capacity is a positive integer.

3. **Step 3: Core Implementation / Modification**
   * Modify the eviction logic in the `put` method to remove the least recently used item from the tail of the linked list instead of the head.
   * Ensure that when an item is evicted, it is also removed from the `cache` Map to prevent stale entries.

4. **Step 4: Output Verification & Testing**
   * After making the changes, run the tests using the command `npx jest tests/ --verbose` to verify that all assertions pass and the cache behaves as expected.

---

## 4. Detailed Walkthrough of Test Cases

### Test Case 1: Standard / Success Case
* **Description**: This test checks if the cache correctly retrieves an existing item and updates its position as the most recently used.
* **Inputs**:
  ```json
  {
      "actions": [
          {"action": "put", "key": "A", "value": 1},
          {"action": "put", "key": "B", "value": 2},
          {"action": "get", "key": "A"},
          {"action": "put", "key": "C", "value": 3},
          {"action": "put", "key": "D", "value": 4}
      ]
  }
  ```
* **Step-by-Step Execution Trace**:
  1. `put("A", 1)` adds A to the cache.
  2. `put("B", 2)` adds B to the cache.
  3. `get("A")` retrieves A, marking it as recently used.
  4. `put("C", 3)` adds C to the cache.
  5. `put("D", 4)` evicts B (the least recently used) and adds D.
* **Expected Output**: The cache should return 1 for `get("A")`, and the final cache state should be {A: 1, C: 3, D: 4}.

### Test Case 2: Edge Case / Validation Fail
* **Description**: This test checks the behavior when trying to add an item to a full cache.
* **Inputs**:
  ```json
  {
      "actions": [
          {"action": "put", "key": "A", "value": 1},
          {"action": "put", "key": "B", "value": 2},
          {"action": "put", "key": "C", "value": 3},
          {"action": "put", "key": "D", "value": 4}
      ]
  }
  ```
* **Step-by-Step Execution Trace**:
  1. `put("A", 1)` adds A to the cache.
  2. `put("B", 2)` adds B to the cache.
  3. `put("C", 3)` adds C to the cache.
  4. `put("D", 4)` attempts to add D, which triggers eviction of A (the least recently used).
* **Expected Output**: The cache should contain {B: 2, C: 3, D: 4} after the last operation, and A should no longer be present in the cache.