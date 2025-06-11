package com.it.melody.mapper;

import com.it.melody.pojo.Playlist;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface PlaylistMapper {
    List<Playlist> getPlaylistById(int id);
}
