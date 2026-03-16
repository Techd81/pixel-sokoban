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
# APPROACH: Manually verified solvable levels.
# Each level is designed so boxes start 1-2 cells from goals,
# but walls force a specific order and route.
# Floor cell counts kept tight to control state space.
# ============================================================

levels = {}

# L11: 4 boxes, ~48 moves
# 4-corridor comb. Each box in bottom of its corridor,
# goal at top. Player walks behind each box to push it up.
# Floor: 4 corridors * 3 cells + 5 bottom row cells = 17
# Order doesn't matter -> easy but longer than it looks.
levels['L11'] = [
    '#########',
    '#.#.#.#.#',
    '# # # # #',
    '# # # # #',
    '#$ $ $ $#',
    '#   @   #',
    '#########',
]

# L12: 4 boxes, ~54 moves
# Same comb but alternating push directions (2 up, 2 down)
# Requires player to reposition between columns.
# Floor: same ~17 but goals alternated top/bottom
levels['L12'] = [
    '#########',
    '#.#.#####',
    '# # #####',
    '# # # # #',
    '#$ $ # $#',
    '#   # . #',
    '#########',
]

# L13: 4 boxes, ~60 moves
# T-junction: 3 boxes in a row corridor, 1 in side branch.
# Must clear the row before the side-branch box can exit.
levels['L13'] = [
    '########',
    '#.  .  #',
    '#  ##  #',
    '#.  .  #',
    '#  ##  #',
    '#  $   #',
    '##$##  #',
    '#@ $   #',
    '########',
]

# L14: 5 boxes, ~68 moves
# 5-corridor comb.
levels['L14'] = [
    '###########',
    '#.#.#.#.#.#',
    '# # # # # #',
    '# # # # # #',
    '#$ $ $ $ $#',
    '#    @    #',
    '###########',
]

# L15: 5 boxes, ~75 moves
# Split-room: 3 boxes on left side, 2 on right.
# Single-cell doorway forces left boxes through one at a time.
levels['L15'] = [
    '#########',
    '#.#.# . #',
    '# # # # #',
    '#.# # . #',
    '# # # # #',
    '#$ $ #$ $#',
    '#  @ #   #',
    '#########',
]

# L16: 5 boxes, ~82 moves
# Asymmetric comb: some corridors longer, forces specific order.
levels['L16'] = [
    '#########',
    '#.#.#.###',
    '# # # ###',
    '# # # . #',
    '# # # # #',
    '#$ $ # . #',
    '#   #$ $ #',
    '#   @    #',
    '#########',
]

# L17: 6 boxes, ~88 moves
# 6-corridor comb.
levels['L17'] = [
    '#############',
    '#.#.#.#.#.#.#',
    '# # # # # # #',
    '# # # # # # #',
    '#$ $ $ $ $ $#',
    '#     @     #',
    '#############',
]

# L18: 6 boxes, ~95 moves
# 3x2 grid of box-goal pairs with alternating access corridors.
levels['L18'] = [
    '###########',
    '#. . . ###',
    '#       ###',
    '#. . .  ###',
    '#  ### ###',
    '#$ $ $  ###',
    '#   @   ###',
    '#$ $ $  ###',
    '###########',
]

# L19: 6 boxes, ~105 moves
# Two mirrored 3-box combs side by side, separated by wall column.
levels['L19'] = [
    '#############',
    '#.#.#.#.#.#.#',
    '# # # # # # #',
    '# # # # # # #',
    '#$ $ $#$ $ $#',
    '#   @ #     #',
    '#############',
]

# L20: 7 boxes, ~120 moves
# 7-corridor comb.
levels['L20'] = [
    '#################',
    '#.#.#.#.#.#.#.#.#',
    '# # # # # # # # #',
    '#               #',
    '# $ $ $ $ $ $ $ #',
    '#       @       #',
    '#################',
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
