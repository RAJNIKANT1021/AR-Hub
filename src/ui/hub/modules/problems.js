// Code Arena problem set. Each test is { args: [...], expected }. Order-insensitive
// comparisons set `unordered: true` (arrays are sorted before comparing).
const PROBLEMS = [
  {
    id: "two-sum", title: "Two Sum", difficulty: "Easy", tags: ["Array", "Hash map"], fn: "twoSum",
    description: "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`. Each input has exactly one solution and you may not use the same element twice. Return the indices in ascending order.",
    starter: "function twoSum(nums, target) {\n  // your code here\n}\n",
    tests: [{ args: [[2, 7, 11, 15], 9], expected: [0, 1] }, { args: [[3, 2, 4], 6], expected: [1, 2] }, { args: [[3, 3], 6], expected: [0, 1] }, { args: [[-1, -2, -3, -4, -5], -8], expected: [2, 4] }],
    unordered: true,
  },
  {
    id: "fizzbuzz", title: "FizzBuzz", difficulty: "Easy", tags: ["Math", "String"], fn: "fizzBuzz",
    description: "Return an array of strings for 1..n where multiples of 3 are \"Fizz\", multiples of 5 are \"Buzz\", multiples of both are \"FizzBuzz\", and other numbers are the number as a string.",
    starter: "function fizzBuzz(n) {\n  \n}\n",
    tests: [{ args: [3], expected: ["1", "2", "Fizz"] }, { args: [5], expected: ["1", "2", "Fizz", "4", "Buzz"] }, { args: [15], expected: ["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"] }],
  },
  {
    id: "palindrome", title: "Valid Palindrome", difficulty: "Easy", tags: ["String", "Two pointers"], fn: "isPalindrome",
    description: "A phrase is a palindrome if, after lowercasing and removing all non-alphanumeric characters, it reads the same forward and backward. Return `true` if `s` is a palindrome.",
    starter: "function isPalindrome(s) {\n  \n}\n",
    tests: [{ args: ["A man, a plan, a canal: Panama"], expected: true }, { args: ["race a car"], expected: false }, { args: [" "], expected: true }, { args: ["0P"], expected: false }],
  },
  {
    id: "parens", title: "Valid Parentheses", difficulty: "Easy", tags: ["Stack", "String"], fn: "isValid",
    description: "Given a string containing just `()[]{}`, determine if the input is valid: brackets must be closed by the same type and in the correct order.",
    starter: "function isValid(s) {\n  \n}\n",
    tests: [{ args: ["()"], expected: true }, { args: ["()[]{}"], expected: true }, { args: ["(]"], expected: false }, { args: ["([)]"], expected: false }, { args: ["{[]}"], expected: true }, { args: ["(("], expected: false }],
  },
  {
    id: "anagram", title: "Valid Anagram", difficulty: "Easy", tags: ["Hash map", "String"], fn: "isAnagram",
    description: "Return `true` if `t` is an anagram of `s` (same letters with the same counts).",
    starter: "function isAnagram(s, t) {\n  \n}\n",
    tests: [{ args: ["anagram", "nagaram"], expected: true }, { args: ["rat", "car"], expected: false }, { args: ["a", "ab"], expected: false }],
  },
  {
    id: "binary-search", title: "Binary Search", difficulty: "Easy", tags: ["Array", "Binary search"], fn: "search",
    description: "Given a sorted array `nums` and a `target`, return its index, or -1 if it's not present. Aim for O(log n).",
    starter: "function search(nums, target) {\n  \n}\n",
    tests: [{ args: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 }, { args: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 }, { args: [[5], 5], expected: 0 }],
  },
  {
    id: "climbing-stairs", title: "Climbing Stairs", difficulty: "Easy", tags: ["Dynamic programming"], fn: "climbStairs",
    description: "You can climb 1 or 2 steps at a time. In how many distinct ways can you climb to the top of a staircase with `n` steps?",
    starter: "function climbStairs(n) {\n  \n}\n",
    tests: [{ args: [2], expected: 2 }, { args: [3], expected: 3 }, { args: [5], expected: 8 }, { args: [45], expected: 1836311903 }],
  },
  {
    id: "roman", title: "Roman to Integer", difficulty: "Easy", tags: ["Math", "String"], fn: "romanToInt",
    description: "Convert a Roman numeral (I, V, X, L, C, D, M — with subtractive forms like IV and CM) to an integer.",
    starter: "function romanToInt(s) {\n  \n}\n",
    tests: [{ args: ["III"], expected: 3 }, { args: ["LVIII"], expected: 58 }, { args: ["MCMXCIV"], expected: 1994 }],
  },
  {
    id: "max-subarray", title: "Maximum Subarray", difficulty: "Medium", tags: ["Array", "Dynamic programming"], fn: "maxSubArray",
    description: "Find the contiguous subarray with the largest sum and return that sum (Kadane's algorithm).",
    starter: "function maxSubArray(nums) {\n  \n}\n",
    tests: [{ args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 }, { args: [[1]], expected: 1 }, { args: [[5, 4, -1, 7, 8]], expected: 23 }, { args: [[-3, -1, -2]], expected: -1 }],
  },
  {
    id: "longest-substring", title: "Longest Substring Without Repeats", difficulty: "Medium", tags: ["Sliding window", "String"], fn: "lengthOfLongestSubstring",
    description: "Return the length of the longest substring of `s` without repeating characters.",
    starter: "function lengthOfLongestSubstring(s) {\n  \n}\n",
    tests: [{ args: ["abcabcbb"], expected: 3 }, { args: ["bbbbb"], expected: 1 }, { args: ["pwwkew"], expected: 3 }, { args: [""], expected: 0 }, { args: ["dvdf"], expected: 3 }],
  },
  {
    id: "merge-intervals", title: "Merge Intervals", difficulty: "Medium", tags: ["Array", "Sorting"], fn: "merge",
    description: "Given an array of intervals `[start, end]`, merge all overlapping intervals and return them sorted by start.",
    starter: "function merge(intervals) {\n  \n}\n",
    tests: [{ args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]] }, { args: [[[1, 4], [4, 5]]], expected: [[1, 5]] }, { args: [[[1, 4], [0, 4]]], expected: [[0, 4]] }],
  },
  {
    id: "group-anagrams", title: "Group Anagrams", difficulty: "Medium", tags: ["Hash map", "Sorting"], fn: "groupAnagrams",
    description: "Group the strings that are anagrams of each other. Return the groups with each group's words sorted alphabetically, and the groups sorted by their first word.",
    starter: "function groupAnagrams(strs) {\n  \n}\n",
    tests: [{ args: [["eat", "tea", "tan", "ate", "nat", "bat"]], expected: [["ate", "eat", "tea"], ["bat"], ["nat", "tan"]] }, { args: [[""]], expected: [[""]] }],
  },
  {
    id: "trapping-rain", title: "Trapping Rain Water", difficulty: "Hard", tags: ["Two pointers", "Stack"], fn: "trap",
    description: "Given `n` non-negative integers representing an elevation map where each bar has width 1, compute how much water it can trap after raining.",
    starter: "function trap(height) {\n  \n}\n",
    tests: [{ args: [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], expected: 6 }, { args: [[4, 2, 0, 3, 2, 5]], expected: 9 }, { args: [[]], expected: 0 }],
  },
];

export default PROBLEMS;
