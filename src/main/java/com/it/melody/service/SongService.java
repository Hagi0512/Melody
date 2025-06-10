package com.it.melody.service;

import com.it.melody.pojo.PageResult;
import com.it.melody.pojo.Songs;
import jakarta.servlet.http.HttpServletResponse;

import java.util.List;

public interface SongService {

    // 搜索歌曲
    PageResult searchSong(String query, int page, int size);

    // 播放歌曲
    void streamSong(String path, HttpServletResponse response);

    // 获取歌曲路径
    String getSongPath(int id);
}
