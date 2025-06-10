package com.it.melody.mapper;

import com.it.melody.pojo.Songs;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface SongMapper {

    //查找歌曲
    List<Songs> searchSong(String query);

    //获取歌曲路径
    String getSongPath(int id);

    List<Songs> getSongsByPlaylistId(int id);
}
