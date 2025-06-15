package com.it.melody.controller;

import com.it.melody.pojo.Playlist;
import com.it.melody.pojo.Result;
import com.it.melody.service.PlaylistServce;
import com.it.melody.service.SongService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/playlist")
public class PlaylistController {

    @Autowired
    PlaylistServce playlistServce;



    // 获取用户创建的歌单
    @GetMapping("/{id}")
    public Result getPlaylist(@PathVariable int id){
        List<Playlist> playlists = playlistServce.getPlaylist(id);
        return Result.success(playlists);
    }

    // 添加歌单歌曲
    @PostMapping("/{id}")
    public Result addSong(@RequestBody Map<String, Integer> info){
        playlistServce.addSongById(info.get("playlistId"), info.get("songId"));
        return Result.success();
    }
}
