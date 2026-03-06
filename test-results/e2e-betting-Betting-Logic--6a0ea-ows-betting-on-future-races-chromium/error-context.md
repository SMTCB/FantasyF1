# Page snapshot

```yaml
- generic [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - img [ref=e5]
      - heading "Admin Access" [level=2] [ref=e7]
      - paragraph [ref=e8]: Enter your admin PIN to continue
      - textbox "Enter PIN" [active] [ref=e9]: "2026"
      - button "AUTHENTICATE" [ref=e10] [cursor=pointer]
    - navigation [ref=e11]:
      - generic [ref=e14]:
        - link "Dashboard" [ref=e15] [cursor=pointer]:
          - /url: /
          - img [ref=e16]
          - generic [ref=e21]: Dashboard
        - link "Year Bets" [ref=e22] [cursor=pointer]:
          - /url: /bets/year
          - img [ref=e23]
          - generic [ref=e29]: Year Bets
        - link "Race Bets" [ref=e30] [cursor=pointer]:
          - /url: /bets/race
          - img [ref=e31]
          - generic [ref=e33]: Race Bets
        - link "Admin" [ref=e34] [cursor=pointer]:
          - /url: /admin
          - img [ref=e36]
          - generic [ref=e39]: Admin
  - button "Open Next.js Dev Tools" [ref=e45] [cursor=pointer]:
    - img [ref=e46]
  - alert [ref=e49]
```