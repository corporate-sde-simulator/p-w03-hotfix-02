/**
 * ====================================================================
 *  JIRA: PLATFORM-2872 — Fix LRU Cache Eviction Bug
 * ====================================================================
 *  Priority: P1 | Sprint: Sprint 25 | Points: 2
 *  Labels: algorithms, typescript, cache, performance
 *
 *  DESCRIPTION:
 *  The LRU cache evicts the most RECENTLY used item instead of the
 *  LEAST recently used one. Also, the size tracker goes negative
 *  after evictions because it's decremented but entries aren't
 *  actually removed from the map.
 *
 *  PRODUCTION LOG:
 *  ───────────────
 *  WARN: Cache hit rate dropped to 12% (expected >80%)
 *  WARN: Cache size reporting -3 (negative count)
 *  ERROR: Frequently accessed keys are being evicted first
 *
 *  ACCEPTANCE CRITERIA:
 *  - [ ] Least recently used item is evicted when cache is full
 *  - [ ] Size tracking is accurate (never negative)
 *  - [ ] get() marks item as recently used
 *  - [ ] All test assertions pass
 * ====================================================================
 */

class LRUNode {
    key: string;
    value: any;
    prev: LRUNode | null = null;
    next: LRUNode | null = null;

    constructor(key: string, value: any) {
        this.key = key;
        this.value = value;
    }
}

class LRUCache {
    private capacity: number;
    private size: number;
    private cache: Map<string, LRUNode>;
    private head: LRUNode;  // Most recently used
    private tail: LRUNode;  // Least recently used

    constructor(capacity: number) {
        this.capacity = capacity;
        this.size = 0;
        this.cache = new Map();

        // Sentinel nodes
        this.head = new LRUNode('', null);
        this.tail = new LRUNode('', null);
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    get(key: string): any {
        const node = this.cache.get(key);
        if (!node) return -1;

        // Move to front (mark as recently used)
        this.moveToFront(node);
        return node.value;
    }

    put(key: string, value: any): void {
        const existing = this.cache.get(key);
        if (existing) {
            existing.value = value;
            this.moveToFront(existing);
            return;
        }

        const newNode = new LRUNode(key, value);
        this.cache.set(key, newNode);
        this.addToFront(newNode);
        this.size++;

        if (this.size > this.capacity) {
            // BUG: Removes from HEAD (most recent) instead of TAIL (least recent)
            const evicted = this.removeFromFront();
            if (evicted) {
                // BUG: Doesn't delete from the Map — stale entries remain
                this.size--;
            }
        }
    }

    private addToFront(node: LRUNode): void {
        node.next = this.head.next;
        node.prev = this.head;
        this.head.next!.prev = node;
        this.head.next = node;
    }

    private removeNode(node: LRUNode): void {
        node.prev!.next = node.next;
        node.next!.prev = node.prev;
    }

    private moveToFront(node: LRUNode): void {
        this.removeNode(node);
        this.addToFront(node);
    }

    private removeFromFront(): LRUNode | null {
        // BUG: This removes the most recently used — should remove from tail
        if (this.head.next === this.tail) return null;
        const node = this.head.next!;
        this.removeNode(node);
        return node;
    }

    getSize(): number {
        return this.size;
    }
}

// ─── Tests ──────────────────────────────────────
const cache = new LRUCache(3);
cache.put("a", 1);
cache.put("b", 2);
cache.put("c", 3);
cache.get("a");        // "a" is now most recently used
cache.put("d", 4);     // Should evict "b" (least recently used), NOT "a"

console.assert(cache.get("a") === 1, "TEST FAIL: 'a' should still exist");
console.assert(cache.get("b") === -1, "TEST FAIL: 'b' should be evicted");
console.assert(cache.getSize() === 3, `TEST FAIL: size should be 3, got ${cache.getSize()}`);
console.log("LRU Cache tests complete");

export { LRUCache };
