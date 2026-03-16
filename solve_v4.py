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

levels = {}

# L11: 4 boxes, target ~48 moves
# Comb pattern: 4 vertical corridors each with 1 goal (top) and 1 box (bottom)
# Player must route each box up its corridor in the right order
# Floor cells: 4 corridors x 4 deep + connecting row = ~24
levels['L11'] = [
    '###########',
    '# . . . . #',
    '# # # # # #',
    '#         #',
    '# $ $ $ $ #',
    '#    @    #',
    '###########',
]

# L12: 4 boxes, target ~54 moves
# Two rooms connected by a single-cell passage; 2 goals per room
# Box ordering matters: must clear passage before pushing through
levels['L12'] = [
    '#########',
    '# .   . #',
    '#   #   #',
    '# .   . #',
    '# # # # #',
    '#  $ $  #',
    '#   @   #',
    '# $ $   #',
    '#########',
]

# L13: 4 boxes, target ~60 moves
# L-shaped corridor; goals in the long arm, boxes in the short arm
# Boxes must exit short arm one by one and traverse the long arm
levels['L13'] = [
    '########',
    '# .    #',
    '#      #',
    '# .    #',
    '# #### #',
    '# .    #',
    '#   ## #',
    '# . $  #',
    '#   $  #',
    '# @ $  #',
    '#   $  #',
    '########',
]

# L14: 5 boxes, target ~68 moves
# Comb with 5 corridors, alternating push directions
levels['L14'] = [
    '#############',
    '# . . . . . #',
    '# # # # # # #',
    '#           #',
    '# $ $ $ $ $ #',
    '#     @     #',
    '#############',
]

# L15: 5 boxes, target ~75 moves
# S-shaped corridor forces boxes to be pushed in sequence
levels['L15'] = [
    '##########',
    '#  . .   #',
    '#  # #   #',
    '#  . .   #',
    '#  # # # #',
    '#  .     #',
    '#  # ### #',
    '# $$ $$  #',
    '#    $ @ #',
    '##########',
]

# L16: 5 boxes, target ~82 moves
# Two-wing design: goals on left wing, boxes on right wing, narrow bridge
levels['L16'] = [
    '############',
    '# . .  $ $ #',
    '#      $ $ #',
    '# . .    $ #',
    '#   ##     #',
    '# . ##  @  #',
    '############',
]

# L17: 6 boxes, target ~88 moves
# Three-tier shelf: 2 goals per shelf level, 2 boxes per shelf
levels['L17'] = [
    '#########',
    '# .. ## #',
    '# $$ ## #',
    '# ##### #',
    '# .. ## #',
    '# $$ ## #',
    '# ##### #',
    '# ..    #',
    '#  @    #',
    '#########',
]

# L18: 6 boxes, target ~95 moves
# Maze with 3 rooms; each room holds 2 boxes and 2 goals
levels['L18'] = [
    '##########',
    '# ..     #',
    '# $$     #',
    '# ###### #',
    '# ..     #',
    '# $$  @  #',
    '# ###### #',
    '# ..     #',
    '#  $     #',
    '#  $     #',
    '##########',
]

# L19: 6 boxes, target ~105 moves
# Cross layout: center player, 6 arms each with 1 box+goal
levels['L19'] = [
    '#############',
    '#  .  #  .  #',
    '#  $  #  $  #',
    '#     #     #',
    '# . $ @ $ . #',
    '#     #     #',
    '#  $  #  $  #',
    '#  .  #  .  #',
    '#############',
]

# L20: 7 boxes, target ~120 moves
# Comb with 7 corridors
levels['L20'] = [
    '#################',
    '# . . . . . . . #',
    '# # # # # # # # #',
    '#               #',
    '# $ $ $ $ $ $ $ #',
    '#       @       #',
    '#################',
]

print('Testing Levels 11-20')
print('=' * 50)
results = {}
for name, rows in levels.items():
    lens = set(len(r) for r in rows)
    if len(lens) > 1:
        print(f'{name}: ROW LENGTH ERROR {[len(r) for r in rows]}')
        results[name] = None
        continue
    boxes = sum(r.count('$')+r.count('*') for r in rows)
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
