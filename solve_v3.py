from collections import deque
import sys

def solve(rows, max_states=3000000):
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
            return None, f'EXCEEDED {max_states} states ({len(vis)} visited)'
        bs = set(bx)
        for dx,dy in [(0,-1),(0,1),(-1,0),(1,0)]:
            nx,ny = px+dx, py+dy
            if ny<0 or ny>=len(grid) or nx<0 or nx>=len(grid[ny]):
                continue
            if grid[ny][nx] == '#': continue
            nb = set(bs)
            if (nx,ny) in bs:
                bnx,bny = nx+dx, ny+dy
                if bny<0 or bny>=len(grid) or bnx<0 or bnx>=len(grid[bny]):
                    continue
                if grid[bny][bnx]=='#' or (bnx,bny) in bs: continue
                nb.remove((nx,ny)); nb.add((bnx,bny))
            ns = (nx,ny,tuple(sorted(nb)))
            if ns not in vis:
                vis.add(ns); q.append((ns,mv+1))
    return None, f'NO SOLUTION ({len(vis)} states)'

# ============================================================
# LEVELS 11-20
# Design principles:
#   - Compact maps (8-10 wide, 7-9 tall for 4-5 boxes)
#   - Goals and boxes interleaved or close together
#   - Corridors and walls to guide paths, not block them
#   - Each box has a clear reachable goal
# ============================================================

levels = {}

# L11: 4 boxes, target ~48 moves
# Classic L-shape corridor design, goals in top corridor, boxes in bottom
levels['L11'] = [
    '#########',
    '# . . . #',
    '#       #',
    '#  . #  #',
    '#    #  #',
    '# $  #  #',
    '# $ $   #',
    '#@  $   #',
    '#########',
]

# L12: 4 boxes, target ~54 moves
# Zigzag corridor connecting boxes to goals
levels['L12'] = [
    '##########',
    '#  . .   #',
    '#        #',
    '#  . .   #',
    '# ##     #',
    '#    ##  #',
    '#  $  $  #',
    '# @$ $   #',
    '##########',
]

# L13: 4 boxes, target ~60 moves
# T-junction forces boxes to be routed one by one
levels['L13'] = [
    '###########',
    '#  .  .   #',
    '#         #',
    '#  .  .   #',
    '#   ###   #',
    '#         #',
    '# $  $ @  #',
    '#  $$     #',
    '###########',
]

# L14: 5 boxes, target ~68 moves
# Compact 10x9, goals in top-left quadrant, boxes packed bottom-right
levels['L14'] = [
    '##########',
    '#. . .   #',
    '#        #',
    '#. .     #',
    '#   ##   #',
    '#    #   #',
    '# $$ # $ #',
    '# $@ # $ #',
    '##########',
]

# L15: 5 boxes, target ~75 moves
# Two rooms connected by narrow passage
levels['L15'] = [
    '###########',
    '#.  .  .  #',
    '#         #',
    '#.  .  #  #',
    '#      #  #',
    '# $  $ #  #',
    '#  $ $    #',
    '#  @  $   #',
    '###########',
]

# L16: 5 boxes, target ~82 moves
# Cross-shaped open area with alcove goals
levels['L16'] = [
    '###########',
    '# .  .    #',
    '#         #',
    '# .  .    #',
    '#   ##    #',
    '#    ##   #',
    '# $  . $  #',
    '#  $$ $   #',
    '#  @      #',
    '###########',
]

# L17: 6 boxes, target ~88 moves
# Three columns of box-goal pairs with connecting corridors
levels['L17'] = [
    '###########',
    '# . . .   #',
    '#         #',
    '# . . .   #',
    '#  #   #  #',
    '#  #   #  #',
    '# $$ $ $  #',
    '#  $ @$   #',
    '###########',
]

# L18: 6 boxes, target ~95 moves
# Warehouse with central pillar, goals on perimeter
levels['L18'] = [
    '############',
    '#. .    . .#',
    '#          #',
    '#. .    . .#',
    '#    ##    #',
    '#    ##    #',
    '# $$ @$ $  #',
    '#   $$     #',
    '############',
]

# L19: 6 boxes, target ~105 moves
# Long horizontal map with S-shaped path
levels['L19'] = [
    '#############',
    '# .  .  .   #',
    '#           #',
    '# .  .  .   #',
    '#  ####     #',
    '#      ###  #',
    '# $  $ $ $  #',
    '#  $ @$     #',
    '#############',
]

# L20: 7 boxes, target ~120 moves
# Large warehouse, goals top row, boxes packed middle
levels['L20'] = [
    '#############',
    '#. . . . .  #',
    '#           #',
    '#. .        #',
    '#   ####    #',
    '#           #',
    '# $$ $$  $  #',
    '#  $ @$     #',
    '#           #',
    '#############',
]

print('Testing Levels 11-20')
print('=' * 50)
results = {}
for name, rows in levels.items():
    lens = set(len(r) for r in rows)
    if len(lens) > 1:
        print(f'{name}: ROW LENGTH ERROR {lens}')
        results[name] = None
        continue
    boxes = sum(r.count('$')+r.count('*') for r in rows)
    goals = sum(r.count('.')+r.count('*')+r.count('+') for r in rows)
    players = sum(r.count('@')+r.count('+') for r in rows)
    if players != 1 or boxes != goals:
        print(f'{name}: INVALID players={players} boxes={boxes} goals={goals}')
        results[name] = None
        continue
    mv, msg = solve(rows)
    print(f'{name}: {msg}')
    results[name] = mv
    sys.stdout.flush()

print('\nSUMMARY:')
for name, mv in results.items():
    status = f'OK moves={mv}' if mv is not None else 'FAIL'
    print(f'  {name}: {status}')
