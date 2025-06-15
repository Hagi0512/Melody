package com.it.melody.controller;

import com.it.melody.pojo.Playlist;
import com.it.melody.pojo.Result;
import com.it.melody.service.PlaylistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/playlist")
public class PlaylistController {

    @Autowired
    PlaylistService playlistService;



    // 获取用户创建的歌单
    @GetMapping("/{id}")
    public Result getPlaylist(@PathVariable int id){
        List<Playlist> playlists = playlistService.getPlaylist(id);
        return Result.success(playlists);
    }

    // 添加歌单歌曲
    @PostMapping("/{id}")
    public Result addSong(@RequestBody Map<String, Integer> info){
        playlistService.addSongById(info.get("playlistId"), info.get("songId"));
        return Result.success();
    }

    // 批量以歌曲id为索引删除歌曲
    @DeleteMapping("/{id}")
    public Result deleteSong(@RequestBody Map<String, List<Integer>> requestBody){
        playlistService.deleteSong(requestBody.get("songIds"));
        return Result.success();
    }

    // 新增歌单
    @PostMapping("/create/{id}")
    public Result createPlaylist(@PathVariable int id, @RequestBody Map<String, String> requestBody){
        String name = requestBody.get("name"), description = requestBody.get("description");
        playlistService.createPlaylist(id, name, description);
        return Result.success();
    }
}
