import type { Level } from './types'

export const LEVELS: Level[] = [
  { name: '一步入库', parMoves: 2, starMoves: { three: 2, two: 3, one: 5 },
    map: ['########','#  .   #','#  $   #','#  @   #','#      #','########'] },

  { name: '绕侧推入', parMoves: 6, starMoves: { three: 6, two: 8, one: 12 },
    map: ['#######','#. $  #','#     #','#     #','#    @#','#######'] },

  { name: '斜线突破', parMoves: 4, starMoves: { three: 4, two: 6, one: 9 },
    map: ['########','#  ..  #','#  $$  #','#   @  #','########'] },

  { name: '角落推入', parMoves: 3, starMoves: { three: 3, two: 5, one: 8 },
    map: [' #######','## .   #','#  $   #','# . $@ #','#      #','########'] },

  { name: '中轴并列', parMoves: 4, starMoves: { three: 4, two: 6, one: 9 },
    map: ['########','#  ..  #','#  $$  #','#   @  #','########'] },

  { name: '三角阵列', parMoves: 5, starMoves: { three: 5, two: 7, one: 10 },
    map: ['#######','# .   #','# $.  #','#  $@ #','#######'] },

  { name: '转角入仓', parMoves: 10, starMoves: { three: 10, two: 13, one: 18 },
    map: ['#######','#.    #','#   # #','#  $  #','#     #','#  @  #','#######'] },

  { name: '平行推入', parMoves: 5, starMoves: { three: 5, two: 8, one: 12 },
    map: ['########','# ..   #','# $$   #','#   @  #','########'] },

  { name: '快捷推入', parMoves: 5, starMoves: { three: 5, two: 7, one: 11 },
    map: ['########','# ..   #','# $$   #','#   @  #','########'] },

  { name: '小双推', parMoves: 5, starMoves: { three: 5, two: 7, one: 11 },
    map: ['########','# . .  #','# $ $  #','#   @  #','########'] },

  { name: '角落归位', parMoves: 6, starMoves: { three: 6, two: 9, one: 13 },
    map: ['########','#. .   #','# $$   #','#   @  #','########'] },

  { name: '纵深对推', parMoves: 6, starMoves: { three: 6, two: 9, one: 13 },
    map: ['########','#  .  .#','#  $  $#','#  @   #','########'] },

  { name: '双叠归仓', parMoves: 10, starMoves: { three: 10, two: 14, one: 19 },
    map: ['########','#  .   #','# .$$ @#','########'] },

  { name: '交错入仓', parMoves: 8, starMoves: { three: 8, two: 11, one: 16 },
    map: ['#######','#. .  #','# $$ @#','#     #','#######'] },

  { name: '开口归仓', parMoves: 8, starMoves: { three: 8, two: 11, one: 16 },
    map: ['#######','#. .  #','# $$ @#','#     #','#######'] },

  { name: '环形推进', parMoves: 7, starMoves: { three: 7, two: 10, one: 14 },
    map: ['########','# .  . #','# $  $ #','#   @  #','########'] },

  { name: '并排推进', parMoves: 7, starMoves: { three: 7, two: 10, one: 14 },
    map: ['########','# .  . #','# $  $ #','#  @   #','########'] },

  { name: '对称推进', parMoves: 7, starMoves: { three: 7, two: 10, one: 14 },
    map: ['########','# .  . #','# $  $ #','#   @  #','########'] },

  { name: '双路推进', parMoves: 7, starMoves: { three: 7, two: 10, one: 14 },
    map: ['########','# .  . #','# $  $ #','#   @  #','########'] },

  { name: '宽廊协作', parMoves: 6, starMoves: { three: 6, two: 9, one: 13 },
    map: ['#########','# .  .  #','# $  $  #','#    @  #','#########'] },

  { name: '中央汇流', parMoves: 6, starMoves: { three: 6, two: 9, one: 13 },
    map: ['#########','#  . .  #','#  $ $  #','#   @   #','#########'] },

  { name: '角落联动', parMoves: 9, starMoves: { three: 9, two: 12, one: 17 },
    map: ['#######','#.  . #','# $$ @#','#     #','#######'] },

  { name: '双箱入库', parMoves: 8, starMoves: { three: 8, two: 11, one: 15 },
    map: ['########','# .  . #','# $  $ #','#   @  #','########'] },

  { name: '平推入库', parMoves: 6, starMoves: { three: 6, two: 9, one: 13 },
    map: ['##########','# .  .   #','# $  $   #','#    @   #','##########'] },

  { name: '侧翼迂回', parMoves: 6, starMoves: { three: 6, two: 9, one: 13 },
    map: ['########','# .    #','# $  . #','#    $ #','#   @  #','########'] },

  { name: '双管齐下', parMoves: 7, starMoves: { three: 7, two: 10, one: 14 },
    map: ['#########','#  . .  #','#  $$   #','#    @  #','#########'] },

  { name: '十字路口', parMoves: 11, starMoves: { three: 11, two: 15, one: 20 },
    map: ['#######','#  .  #','# $.$ #','#  @  #','#######'] },

  { name: '错位归仓', parMoves: 11, starMoves: { three: 11, two: 15, one: 21 },
    map: ['#######','#.  . #','# $$ @#','#     #','#######'] },

  { name: '长廊换位', parMoves: 7, starMoves: { three: 7, two: 10, one: 14 },
    map: ['##########','#  .  .  #','#  $  $  #','#  @     #','##########'] },

  { name: '侧压归仓', parMoves: 10, starMoves: { three: 10, two: 14, one: 19 },
    map: ['########','# .  . #','# $$ @ #','#      #','########'] },

  { name: '双翼展开', parMoves: 12, starMoves: { three: 12, two: 16, one: 22 },
    map: ['########','#.    .#','# $  $ #','#   @  #','########'] },

  { name: '中路突破', parMoves: 12, starMoves: { three: 12, two: 16, one: 22 },
    map: ['########','#  .   #','# $. $ #','#   @  #','########'] },

  { name: '中轴对称', parMoves: 11, starMoves: { three: 11, two: 15, one: 21 },
    map: ['#########','#   .   #','#  $.$  #','#   @   #','#########'] },

  { name: '王者殿堂', parMoves: 12, starMoves: { three: 12, two: 16, one: 22 },
    map: ['#########','#  . .  #','# $   $ #','#   @   #','#########'] },

  { name: '交叉火线', parMoves: 17, starMoves: { three: 17, two: 22, one: 30 },
    map: ['#######','#  .  #','# $.$ #','#  @  #','#######'] },

  { name: '双向推进', parMoves: 11, starMoves: { three: 11, two: 15, one: 21 },
    map: ['########','#   .  #','# $    #','#   $  #','#  . @ #','########'] },

  { name: '环形走廊', parMoves: 8, starMoves: { three: 8, two: 11, one: 15 },
    map: ['########','# .. . #','# $$ $ #','#   @  #','########'] },

  { name: '斜推入库', parMoves: 15, starMoves: { three: 15, two: 20, one: 27 },
    map: ['########','#  .   #','# $    #','# .$ @ #','########'] },

  { name: '并排入库', parMoves: 15, starMoves: { three: 15, two: 20, one: 27 },
    map: ['########','# .  . #','# $  $ #','#  @   #','########'] },

  { name: '先后顺序', parMoves: 14, starMoves: { three: 14, two: 18, one: 25 },
    map: ['#######','#.   .#','#     #','#$   $#','#  @  #','#######'] },

  { name: '双人推进', parMoves: 12, starMoves: { three: 12, two: 16, one: 22 },
    map: ['########','#  .   #','# .$   #','#  $   #','#  @   #','########'] },

  { name: '梯形归位', parMoves: 14, starMoves: { three: 14, two: 18, one: 25 },
    map: ['#########','#  .    #','# $ . $ #','#   @   #','#########'] },

  { name: '斜角仓储', parMoves: 13, starMoves: { three: 13, two: 17, one: 24 },
    map: ['########','#  .   #','# $ #  #','#   $  #','# . @  #','########'] },

  { name: '双格归位', parMoves: 17, starMoves: { three: 17, two: 22, one: 30 },
    map: ['########','#  .   #','# $  $ #','#  . @ #','########'] },

  { name: '横排冲锋', parMoves: 10, starMoves: { three: 10, two: 14, one: 19 },
    map: ['########','# . . .#','# $ $ $#','#    @ #','########'] },

  { name: '分叉推箱', parMoves: 16, starMoves: { three: 16, two: 21, one: 28 },
    map: ['#########','#  . .  #','# $   $ #','#   @   #','#########'] },

  { name: '三连推', parMoves: 11, starMoves: { three: 11, two: 15, one: 21 },
    map: ['########','#. . . #','# $$$  #','#  @   #','########'] },

  { name: '阶梯移位', parMoves: 12, starMoves: { three: 12, two: 16, one: 22 },
    map: ['########','#. . . #','# $$$  #','#  @   #','########'] },

  { name: '终极挑战', parMoves: 17, starMoves: { three: 17, two: 22, one: 30 },
    map: ['##########','#  .  .  #','# $    $ #','#   @    #','##########'] },

  { name: '三横排', parMoves: 11, starMoves: { three: 11, two: 15, one: 21 },
    map: ['#########','# . . . #','# $ $ $ #','#   @   #','#########'] },

  { name: '三叉路口', parMoves: 18, starMoves: { three: 18, two: 24, one: 32 },
    map: ['#########','#   .   #','# $   $ #','#   .   #','#   @   #','#########'] },

  { name: '隔墙绕推', parMoves: 16, starMoves: { three: 16, two: 21, one: 28 },
    map: ['#########','#  . .  #','#       #','#  ###  #','# $   $ #','#   @   #','#########'] },

  { name: '隔墙推箱', parMoves: 19, starMoves: { three: 19, two: 25, one: 33 },
    map: ['########','#   .  #','# $    #','#  #   #','# $  @ #','#  .   #','########'] },

  { name: '迷宫五号', parMoves: 21, starMoves: { three: 21, two: 27, one: 36 },
    map: ['#########','#       #','#  $#$  #','#   @   #','#  . .  #','#########'] },

  { name: '错落入库', parMoves: 7, starMoves: { three: 7, two: 10, one: 14 },
    map: ['########','# $. .  #','#  $  $ #','#  $    #','# . .@  #','########'] },

  { name: '四角汇聚', parMoves: 16, starMoves: { three: 16, two: 21, one: 28 },
    map: ['##########','#. .    .#','# $$  $  #','#    @   #','##########'] },

  { name: '双通道', parMoves: 17, starMoves: { three: 17, two: 22, one: 30 },
    map: ['########','#. . . #','#      #','# $$$  #','#   @  #','########'] },

  { name: 'L形走廊', parMoves: 24, starMoves: { three: 24, two: 31, one: 41 },
    map: ['#######','#.   .#','#     #','#     #','#$   $#','#     #','#     #','#  @  #','#######'] },

  { name: '三连入库', parMoves: 20, starMoves: { three: 20, two: 26, one: 35 },
    map: ['#########','#.  .  .#','#       #','#$  $  $#','#   @   #','#########'] },

  { name: '窄道终盘', parMoves: 28, starMoves: { three: 28, two: 36, one: 48 },
    map: ['#######','#. . .#','#     #','# # # #','#$ $ $#','#  @  #','#######'] },

  { name: '锁链推进', parMoves: 26, starMoves: { three: 26, two: 34, one: 44 },
    map: ['######   ','#    #   ','# .$ ####','##$#    #',' # . $  #',' #  .@  #',' ########'] },

  { name: '旋转门', parMoves: 28, starMoves: { three: 28, two: 36, one: 48 },
    map: [' ########','##  .   #','# $   # #','#   #$  #','# #   . #','#  $# @ #','#  .    #',' ########'] },

  { name: '双螺旋', parMoves: 34, starMoves: { three: 34, two: 44, one: 56 },
    map: ['#########','#   #   #','# $   # #','#  ##.$ #','# $.#   #','#     # #','## .# @ #',' ########'] },

  { name: '四角归位', parMoves: 25, starMoves: { three: 25, two: 33, one: 43 },
    map: ['#########','# .   . #','#  $ $  #','#   @   #','#  $ $  #','# .   . #','#########'] },

  { name: '回廊调度', parMoves: 34, starMoves: { three: 34, two: 44, one: 58 },
    map: ['##########','#  .  .  #','#        #','# $# ##  #','#   $    #','#  ## $  #','#  .  @  #','##########'] },

  { name: '回旋镖', parMoves: 26, starMoves: { three: 26, two: 34, one: 44 },
    map: ['  ###### ','###    # ','# $ .  # ','# #$## ##','# . $   #','##.  $  #',' #  .@  #',' ########'] },

  { name: '蛇形走廊', parMoves: 31, starMoves: { three: 31, two: 40, one: 52 },
    map: ['########  ','#  . . #  ','#      ## ','## $#$  # ',' # @#   # ',' # $# $ # ',' #  #.  # ',' ####.### '] },

  { name: '中心对称', parMoves: 58, starMoves: { three: 58, two: 73, one: 92 },
    map: ['#########','#  .@.  #','# $###$ #','#   #   #','# $###$ #','#  . .  #','#########'] },

  { name: '迷城', parMoves: 63, starMoves: { three: 63, two: 80, one: 100 },
    map: ['##########','#  .  .  #','# $####$ #','#   ##   #','# $####$ #','#  . @.  #','##########'] },

  { name: '大终局', parMoves: 63, starMoves: { three: 63, two: 80, one: 100 },
    map: ['##########','#  . @.  #','# $####$ #','#   ##   #','# $####$ #','#  .  .  #','##########'] },
]
