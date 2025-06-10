package com.it.melody.controller;

import com.it.melody.pojo.Login;
import com.it.melody.pojo.PageResult;
import com.it.melody.pojo.Result;
import com.it.melody.pojo.Songs;
import com.it.melody.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    UserService userService;

    //获取用户收藏的歌分页模式
    @GetMapping("/{id}/liked-song")
    public Result getLikedSongs(@PathVariable int id,
                                @RequestParam(value = "page", defaultValue = "1") int page,
                                @RequestParam(value = "size", defaultValue = "8") int size){
        PageResult pageResult = userService.getLikedSongs(id, page, size);
        return Result.success(pageResult);
    }

    //获取用户全部收藏
    @GetMapping("/{id}/liked-song/all")
    public Result getAllLikedSongs(@PathVariable int id){
        List<Songs> songs = userService.getAllLikedSongs(id);
        return Result.success(songs);
    }

    // 用户登入
    @PostMapping("/login")
    public Result login(@RequestBody Map<String, String> loginInfo){
        Login login = userService.login(loginInfo.get("username"), loginInfo.get("password"));
        if (login == null){
            return Result.error("用户名或密码错误");
        }
        return Result.success(login);
    }

    // 用户注册
    @PostMapping("/register")
    public Result register(@RequestBody Map<String, String> registerInfo){
        userService.register(registerInfo.get("username"), registerInfo.get("password"));
        return Result.success();
    }

    // 添加用户收藏
    @PostMapping("/{id}/liked-song/{songId}")
    public Result addLikedSong(@PathVariable int id, @PathVariable int songId){
        userService.addLikedSong(id, songId);
        return Result.success();
    }

    // 删除用户收藏
    @DeleteMapping("/{id}/liked-song/{songId}")
    public Result deleteLikedSong(@PathVariable int id, @PathVariable int songId){
        userService.deleteLikedSong(id, songId);
        return Result.success();
    }
}
