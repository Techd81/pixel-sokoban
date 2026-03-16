from collections import deque

def solve(rows, max_states=2000000):
    grid = [list(r) for r in rows]
    goals, boxes, player = [], [], None
    for y, row in enumerate(grid):
        for x, c in enumerate(row):
            if c in ('.','*','+'): goals.append((x,y))
            if c in ('$','*'): boxes.append((x,y))
            if c in ('@','+'): player = (x,y)
    if not player: return None, 'no player'
    if len(boxes) != len(goals): return None, f'boxes={len(boxes)} goals={len(goals)}'
    goal_set = frozenset(goals)
    start = (player[0], player[1], tuple(sorted(boxes)))
    q = deque([(start, 0)])
    vis = {start}
    while q:
        (px,py,bx), mv = q.popleft()
        if frozenset(bx) == goal_set: return mv, f'SOLVABLE in {mv} moves'
        if len(vis) > max_states: return None, f'EXCEEDED {max_states} states'
        bs = set(bx)
        for dx,dy in [(0,-1),(0,1),(-1,0),(1,0)]:
            nx,ny = px+dx, py+dy
            if grid[ny][nx] == '#': continue
            nb = set(bs)
            if (nx,ny) in bs:
                bnx,bny = nx+dx, ny+dy
                if grid[bny][bnx]=='#' or (bnx,bny) in bs: continue
                nb.remove((nx,ny)); nb.add((bnx,bny))
            ns = (nx,ny,tuple(sorted(nb)))
            if ns not in vis:
                vis.add(ns); q.append((ns,mv+1))
    return None, f'NO SOLUTION ({len(vis)} states)'

levels = {}

# L11: 4 boxes depth=2 (PROVEN)
levels['L11'] = [
    '#########',
    '#.#.#.#.#',
    '# # # # #',
    '# # # # #',
    '#$ $ $ $#',
    '#   @   #',
    '#########',
]

# L12: 4 boxes depth=3 (PROVEN)
levels['L12'] = [
    '#########',
    '#.#.#.#.#',
    '# # # # #',
    '# # # # #',
    '# # # # #',
    '#$ $ $ $#',
    '#   @   #',
    '#########',
]

# L13: 4 boxes depth=4 (PROVEN)
levels['L13'] = [
    '#########',
    '#.#.#.#.#',
    '# # # # #',
    '# # # # #',
    '# # # # #',
    '# # # # #',
    '#$ $ $ $#',
    '#   @   #',
    '#########',
]

# L14: 5 boxes depth=2 (PROVEN)
levels['L14'] = [
    '###########',
    '#.#.#.#.#.#',
    '# # # # # #',
    '# # # # # #',
    '#$ $ $ $ $#',
    '#    @    #',
    '###########',
]

# L15: 5 boxes depth=3 (PROVEN)
levels['L15'] = [
    '###########',
    '#.#.#.#.#.#',
    '# # # # # #',
    '# # # # # #',
    '# # # # # #',
    '#$ $ $ $ $#',
    '#    @    #',
    '###########',
]

# L16: 5 boxes, two-group comb with wall separating them.
# Left group: 3 boxes depth=2, Right group: 2 boxes depth=2
# Only ONE gap in the dividing wall -> forces ordering
# Width = 9 + 1(wall) + 5 = 15? No - share boundary.
# Layout: '#.#.#.##.#.#' top
# The double-wall ## is the divider with no gap at top,
# but the bottom row has a gap to allow player to cross.
levels['L16'] = [
    '#############',
    '#.#.#.##.#.#.#',
    '# # # ## # # #',
    '# # # ## # # #',
    '#$ $ $  $ $ $#',
    '#    @       #',
    '#############',
]

# L17: 6 boxes depth=1 (PROVEN)
levels['L17'] = [
    '#############',
    '#.#.#.#.#.#.#',
    '# # # # # # #',
    '#$ $ $ $ $ $#',
    '#     @     #',
    '#############',
]

# L18: 6 boxes, two groups of 3 separated by wall with 1 gap
# Each group is a 3-box comb depth=1
# Gap forces player to move between groups
levels['L18'] = [
    '#############',
    '#.#.#.##.#.#.#',
    '# # # ## # # #',
    '#$ $ $  $ $ $#',
    '#    @       #',
    '#############',
]

# L19: 6 boxes, two groups of 3, wall with gap, depth=2
levels['L19'] = [
    '#############',
    '#.#.#.##.#.#.#',
    '# # # ## # # #',
    '# # # ## # # #',
    '#$ $ $  $ $ $#',
    '#    @       #',
    '#############',
]

# L20: 7 boxes, two groups 4+3 separated by wall with 1 gap
# Left: 4-box comb depth=1, Right: 3-box comb depth=1
levels['L20'] = [
    '###############',
    '#.#.#.#.##.#.#.#',
    '# # # # ## # # #',
    '#$ $ $ $  $ $ $#',
    '#      @       #',
    '###############',
]
