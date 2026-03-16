from collections import deque

def solve(map_rows, max_states=2000000):
    grid = [list(r) for r in map_rows]
    lengths = set(len(r) for r in grid)
    if len(lengths) > 1:
        return None, f'row length mismatch {lengths}'
    goals, boxes, player = [], [], None
    for y, row in enumerate(grid):
        for x, c in enumerate(row):
            if c in ('.', '*', '+'): goals.append((x,y))
            if c in ('$', '*'): boxes.append((x,y))
            if c in ('@', '+'): player = (x,y)
    if not player or len(boxes) != len(goals):
        return None, f'invalid: player={player} boxes={len(boxes)} goals={len(goals)}'
    goal_set = frozenset(goals)
    start = (player[0], player[1], tuple(sorted(boxes)))
    queue = deque([(start, 0)])
    visited = {start}
    while queue:
        (px, py, bx), moves = queue.popleft()
        if frozenset(bx) == goal_set:
            return moves, f'SOLVABLE in {moves} moves'
        if len(visited) > max_states:
            return None, f'exceeded {max_states} states'
        bset = set(bx)
        for dx, dy in [(0,-1),(0,1),(-1,0),(1,0)]:
            nx, ny = px+dx, py+dy
            if grid[ny][nx] == '#': continue
            new_bset = set(bset)
            if (nx,ny) in bset:
                bnx, bny = nx+dx, ny+dy
                if grid[bny][bnx] == '#' or (bnx,bny) in bset: continue
                new_bset.remove((nx,ny))
                new_bset.add((bnx,bny))
            ns = (nx, ny, tuple(sorted(new_bset)))
            if ns not in visited:
                visited.add(ns)
                queue.append((ns, moves+1))
    return None, f'no solution ({len(visited)} states)'

def validate(name, rows):
    lengths = [len(r) for r in rows]
    if len(set(lengths)) > 1:
        print(f'  ERROR row lengths: {lengths}'); return False
    boxes = sum(r.count('$')+r.count('*') for r in rows)
    goals = sum(r.count('.')+r.count('*')+r.count('+') for r in rows)
    players = sum(r.count('@')+r.count('+') for r in rows)
    if players != 1:
        print(f'  ERROR players={players}'); return False
    if boxes != goals:
        print(f'  ERROR boxes={boxes} goals={goals}'); return False
    return True

C = {}
# L11: 4 boxes ~48 moves
# Goals top-right quadrant, boxes bottom-left, open interior
C['L11'] = [
    '##########',
    '#      . #',
    '#    . . #',
    '#      . #',
    '#        #',
    '#  $  $  #',
    '#        #',
    '#  $ @$  #',
    '##########',
]

# L12: 4 boxes ~54 moves
# Wall column forces detour
C['L12'] = [
    '###########',
    '# . .     #',
    '#         #',
    '# . .     #',
    '#   ##    #',
    '#    #    #',
    '# $  # $  #',
    '# $@ # $  #',
    '###########',
]

# L13: 4 boxes ~60 moves
# Goals on right side, boxes on left, horizontal wall blocks direct path
C['L13'] = [
    '############',
    '#     . .  #',
    '#          #',
    '#     . .  #',
    '#  ######  #',
    '#          #',
    '# $   $    #',
    '# $ @ $    #',
    '############',
]

# L14: 5 boxes ~68 moves
C['L14'] = [
    '############',
    '# . . .    #',
    '#          #',
    '# . .      #',
    '#          #',
    '#  $ $     #',
    '#   $ $    #',
    '#  @ $     #',
    '############',
]

# L15: 5 boxes ~75 moves
C['L15'] = [
    '#############',
    '#  . . .    #',
    '#           #',
    '#    . .    #',
    '#           #',
    '#  $  $     #',
    '#    $ $    #',
    '#  @  $     #',
    '#############',
]
# L16: 5 boxes ~82 moves
# Tall narrow map, goals top, boxes bottom, wall in middle
C['L16'] = [
    '##########',
    '#  . .   #',
    '#  . .   #',
    '#    .   #',
    '#        #',
    '# #####  #',
    '#        #',
    '#  $  $  #',
    '#   $    #',
    '#  @ $   #',
    '#    $   #',
    '##########',
]

# L17: 6 boxes ~88 moves
C['L17'] = [
    '#############',
    '# . . .     #',
    '#           #',
    '# . . .     #',
    '#           #',
    '#  $   $    #',
    '#    $      #',
    '#  $   $    #',
    '#  @ $      #',
    '#############',
]

# L18: 6 boxes ~95 moves
# Goals right side, boxes left side, open interior
C['L18'] = [
    '##############',
    '#      . . . #',
    '#            #',
    '#      . . . #',
    '#            #',
    '# $  $       #',
    '#    $  $    #',
    '# $@ $       #',
    '#   $        #',
    '##############',
]

# L19: 6 boxes ~105 moves
# Wall maze, goals top-right, boxes scattered bottom
C['L19'] = [
    '##############',
    '#    . . .   #',
    '#    . . .   #',
    '#            #',
    '#   ###      #',
    '#            #',
    '# $  $  $    #',
    '#   @        #',
    '# $  $  $    #',
    '#            #',
    '##############',
]

# L20: 7 boxes ~120 moves
C['L20'] = [
    '###############',
    '#   . . . .   #',
    '#             #',
    '#   . . .     #',
    '#             #',
    '#  $  $  $    #',
    '#    $  $     #',
    '#  $@    $    #',
    '#             #',
    '###############',
]

print('=' * 55)
print('Levels 11-20 BFS Solver')
print('=' * 55)

results = {}
for name, rows in C.items():
    print(f'\n{name}:')
    if not validate(name, rows):
        results[name] = (None, 'invalid')
        continue
    moves, msg = solve(rows)
    print(f'  => {msg}')
    results[name] = (moves, msg)

print('\nSUMMARY')
for name, (moves, msg) in results.items():
    tag = 'OK' if moves else 'FAIL'
    print(f'  [{tag}] {name}: {msg}')
