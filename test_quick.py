from collections import deque

def solve(rows, max_states=2000000):
    grid = [list(r) for r in rows]
    goals, boxes, player = [], [], None
    for y, row in enumerate(grid):
        for x, c in enumerate(row):
            if c in ('.','*','+'): goals.append((x,y))
            if c in ('$','*'): boxes.append((x,y))
            if c in ('@','+'): player = (x,y)
    goal_set = frozenset(goals)
    start = (player[0], player[1], tuple(sorted(boxes)))
    q = deque([(start, 0)])
    vis = {start}
    while q:
        (px,py,bx), mv = q.popleft()
        if frozenset(bx) == goal_set:
            return mv
        if len(vis) > max_states:
            return -1
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
    return 0

levels = {
'L11': [
'##########',
'#      . #',
'#    . . #',
'#      . #',
'#        #',
'#  $  $  #',
'#        #',
'#  $ @$  #',
'##########',
],
'L12': [
'###########',
'# . .     #',
'#         #',
'# . .     #',
'#   ##    #',
'#    #    #',
'# $  # $  #',
'# $@ # $  #',
'###########',
],
'L13': [
'############',
'#     . .  #',
'#          #',
'#     . .  #',
'#  ######  #',
'#          #',
'# $   $    #',
'# $ @ $    #',
'############',
],
'L14': [
'############',
'# . . .    #',
'#          #',
'# . .      #',
'#          #',
'#  $ $     #',
'#   $ $    #',
'#  @ $     #',
'############',
],
'L15': [
'#############',
'#  . . .    #',
'#           #',
'#    . .    #',
'#           #',
'#  $  $     #',
'#    $ $    #',
'#  @  $     #',
'#############',
],
}

for name, rows in levels.items():
    r = solve(rows)
    if r > 0:
        print(f'{name}: SOLVABLE in {r} moves')
    elif r == -1:
        print(f'{name}: EXCEEDED states')
    else:
        print(f'{name}: NO SOLUTION')
