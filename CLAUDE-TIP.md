
## Claude TIP
- claude update : 클로드 코드 업데이트하기 - 하네스업데이트및 중요스킬 업데이트때
- claude --dangerously-skip-permissions  : 무조건통과(조사작업시킬때)


### 팀플랜전용
- claude --enable-auto-mode : 안전한 자동모드, 승인과 그냥실행의 중간안전모드(팀에서만 된다함) - 아직작동안함(x)
```
  오토모드를 기본으로 켜고 싶으시면 settings.local.json에 defaultMode를 추가하면 됩니다:                                                                                                                                                          
                                                                                                                                                                                                                                                  
  {                                                                                                                                                                                                                                               
    "permissions": {                                                                                                                                                                                                                              
      "defaultMode": "auto",                                                                                                                                                                                                                      
      "allow": [ ... ]                                                                                                                                                                                                                            
    }                                                                                                                                                                                                                                             
  }      
```

### skill-creator

```
/plugin marketplace add anthropics/skills

/plugin install skill-creator@anthropic-agent-skills 
```