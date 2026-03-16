from collections import deque
import sys

def solve(rows, max_states=2000000):
    grid = [list(r) for r in rows]
    goals, boxes, player = [], [], None
    for y, row in enumerate(grid):
        for x, c in enumerate(row):
            if c in ('.','*','+'): goals.append((x,y))
            if c in ('$','*'): boxes.append((x,y))
            if c in ('@','+'): player = (x,y)
    if not player:
        return None, 'no player'
    if len(boxes) != len(goals):
        return None, f'boxes={len(boxes)} goals={len(goals)}'
    goal_set = frozenset(goals)
    start = (player[0], player[1], tuple(sorted(boxes)))
    q = deque([(start, 0)])
    vis = {start}
    while q:
        (px,py,bx), mv = q.popleft()
        if frozenset(bx) == goal_set:
            return mv, f'SOLVABLE in {mv} moves'
        if len(vis) > max_states:
            return None, f'EXCEEDED {max_states} states'
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

# ============================================================
# All levels use the COMB pattern (verified to work in L11/L14).
# For difficulty, corridors vary in depth (1-3 cells) and the
# bottom connecting row is sized based on box count.
#
# comb_level(N, depths, name):
#   N = number of boxes
#   depths = list of N depths (cells between goal and box)
#   Width = 2N+1 chars: boundary + alternating (floor,wall) * N
#   Each corridor: '#' + ('.#' or ' #') * N top, then depth rows
#   Bottom row: all floor + player
# ============================================================

levels = {}

# --- L11: 4 boxes, comb depth=2 each ---
# Width=9, floor = 4*2 + 7(bottom) = 15 -> C(15,4)*15 = 57750 states
levels['L11'] = [
    '#########',  # 9
    '#.#.#.#.#',  # 9  goals at top of each corridor
    '# # # # #',  # 9  corridor depth 1
    '# # # # #',  # 9  corridor depth 2
    '#$ $ $ $#',  # 9  boxes at bottom of corridors
    '#   @   #',  # 9  player in bottom row
    '#########',  # 9
]

# --- L12: 4 boxes, asymmetric depths (2,1,3,2) ---
# Creates harder ordering since corridors differ in length
# Width=9, same floor estimate ~15-17
levels['L12'] = [
    '#########',
    '#.#.#.#.#',
    '# # # # #',
    '#####.# #',
    '#####$ # #',
    '####  # # #',  # This is getting complex; use a simpler approach
]

levels = {}  # reset and do it properly

# L11: 4 boxes, uniform depth=2, width=9
levels['L11'] = [
    '#########',
    '#.#.#.#.#',
    '# # # # #',
    '# # # # #',
    '#$ $ $ $#',
    '#   @   #',
    '#########',
]

# L12: 4 boxes, uniform depth=3, width=9
# More moves needed to push each box up 3 cells
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

# L13: 4 boxes, depth=4, width=9
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

# L14: 5 boxes, uniform depth=2, width=11
levels['L14'] = [
    '###########',
    '#.#.#.#.#.#',
    '# # # # # #',
    '# # # # # #',
    '#$ $ $ $ $#',
    '#    @    #',
    '###########',
]

# L15: 5 boxes, uniform depth=3, width=11
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

# L16: 5 boxes, uniform depth=4, width=11
levels['L16'] = [
    '###########',
    '#.#.#.#.#.#',
    '# # # # # #',
    '# # # # # #',
    '# # # # # #',
    '# # # # # #',
    '#$ $ $ $ $#',
    '#    @    #',
    '###########',
]

# L17: 6 boxes, depth=1, width=13
# floor = 6*1 + 11(bottom) = 17, states = C(17,6)*17 = 230230*17 = tiny
levels['L17'] = [
    '#############',
    '#.#.#.#.#.#.#',
    '# # # # # # #',
    '#$ $ $ $ $ $#',
    '#     @     #',
    '#############',
]

# L18: 6 boxes, depth=2, width=13
levels['L18'] = [
    '#############',
    '#.#.#.#.#.#.#',
    '# # # # # # #',
    '# # # # # # #',
    '#$ $ $ $ $ $#',
    '#     @     #',
    '#############',
]

# L19: 6 boxes, depth=3, width=13
levels['L19'] = [
    '#############',
    '#.#.#.#.#.#.#',
    '# # # # # # #',
    '# # # # # # #',
    '# # # # # # #',
    '#$ $ $ $ $ $#',
    '#     @     #',
    '#############',
]

# L20: 7 boxes, depth=2, width=15
levels['L20'] = [
    '###############',
    '#.#.#.#.#.#.#.#',
    '# # # # # # # #',
    '# # # # # # # #',
    '#$ $ $ $ $ $ $#',
    '#      @      #',
    '###############',
]

print('Testing Levels 11-20')
print('=' * 55)
results = {}
for name, rows in levels.items():
    lens = [len(r) for r in rows]
    if len(set(lens)) > 1:
        print(f'{name}: ROW LENGTH ERROR {lens}')
        results[name] = None
        continue
    boxes  = sum(r.count('$')+r.count('*') for r in rows)
    goals  = sum(r.count('.')+r.count('*')+r.count('+') for r in rows)
    players = sum(r.count('@')+r.count('+') for r in rows)
    floors = sum(c in ' .@+$*' for row in rows for c in row)
    if players != 1 or boxes != goals:
        print(f'{name}: INVALID players={players} boxes={boxes} goals={goals}')
        results[name] = None
        continue
    print(f'{name}: floor={floors} boxes={boxes} ', end='', flush=True)
    mv, msg = solve(rows)
    print(msg)
    results[name] = mv

print('\nSUMMARY:')
for name, mv in results.items():
    status = f'OK moves={mv}' if mv is not None else 'FAIL'
    print(f'  {name}: {status}')
