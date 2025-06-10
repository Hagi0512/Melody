package com.it.melody.controller;

import com.it.melody.pojo.PageResult;
import com.it.melody.pojo.Result;
import com.it.melody.pojo.Songs;
import com.it.melody.service.SongService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/song")
public class SongController {

    @Autowired
    SongService songService;

    //搜索歌曲
    @GetMapping("/search")
    public Result searchSong(@RequestParam(value = "keywords", defaultValue = "") String query,
                             @RequestParam(value = "page", defaultValue = "1") int page,
                             @RequestParam(value = "size", defaultValue = "10") int size){
        PageResult pageResult = songService.searchSong(query, page, size);
        return Result.success(pageResult);
    }

    //播放歌曲
    @GetMapping("/stream")
    public void streamSong(@RequestParam(value = "id", defaultValue = "") int id, HttpServletResponse response){
        String file = getSongPath(id);
        songService.streamSong(file,response);
    }

    //根据歌名获取歌曲路径
    public String getSongPath(int id){
        return songService.getSongPath(id);
    }
}
